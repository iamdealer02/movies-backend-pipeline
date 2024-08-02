import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import pool from '../../boot/database/db_connect';
import { jest } from '@jest/globals';
// creating an in memory mongodb server
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToMongoDB } from '../../boot/setup';
import mongoose from 'mongoose';
import { user, SuperTestAgent } from './test.data';
import * as statusCodes from '../../constants/statusCodes';

let app: App;
let mongodb: MongoMemoryServer;
let agent: SuperTestAgent;
process.env.JWT_SECRET = 'testsecret';

beforeAll(async () => {
  try {
    app = registerCoreMiddleWare();
    mongodb = await MongoMemoryServer.create();
    const uri = mongodb.getUri();
    agent = request.agent(app) as unknown as SuperTestAgent;
    connectToMongoDB(uri);
  } catch (error) {
    throw error;
  }
});

// close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

afterAll(async () => {
  await pool.end();
  await mongoose.disconnect();
  await mongodb.stop();
});

describe('messages integration tests', () => {
  let token: string;

  beforeAll(async () => {
    try {
      const createUser = await agent.post('/auth/signup').send(user);

      // throw error if user creation
      if (createUser.status === statusCodes.created) {
        const loginUser = await agent
          .post('/auth/login')
          .send({ email: user.email, password: user.password });

        // throw error if login fails
        if (loginUser.status !== statusCodes.success) {
          throw new Error('Error logging in user in beforeAll.');
        }

        // setting token for authenticated requests
        token = loginUser.body.token;
      } else {
        throw new Error('Error creating user in beforeAll.');
      }
    } catch (err) {
      throw err;
    }
  });

  describe('POST /messages/add', () => {
    it('should add a message', async () => {
      const response = await agent
        .post('/messages/add/message')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: { name: 'test message' } });
      expect(response.status).toBe(statusCodes.created);
      expect(response.body.name).toBe('test message');
    });

    it('should return 400 if message object is missing', async () => {
      const response = await agent
        .post('/messages/add/message')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(statusCodes.badRequest);
      expect(response.body.error).toBe('missing information');
    });

    it('should return 401 if user is not authenticated', async () => {
      // not setting token
      const response = await agent
        .post('/messages/add/message')
        .send({ message: { name: 'test message' } });

      expect(response.status).toBe(statusCodes.unauthorized);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /messages', () => {
    it('should return all messages', async () => {
      const response = await agent
        .get('/messages')
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(statusCodes.success);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /messages/edit/:messageId', () => {
    let messageId: string;
    beforeAll(async () => {
      try {
        const response = await agent
          .post('/messages/add/message')
          .set('Authorization', `Bearer ${token}`)
          .send({ message: { name: 'test message' } });
        messageId = response.body._id;
      } catch (error) {
        throw error;
      }
    });

    it('should edit a message', async () => {
      const response = await agent
        .put(`/messages/edit/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'edited message' });
      expect(response.status).toBe(statusCodes.success);
      expect(response.body.name).toBe('edited message');
    });

    it('should return 400 if name or messageId is missing', async () => {
      const response = await agent
        .put(`/messages/edit/${messageId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(statusCodes.badRequest);
      expect(response.body.error).toBe('missing information');
    });
  });

  describe('DELETE /messages/delete/:messageId', () => {
    let messageId: string;
    beforeAll(async () => {
      try {
        const response = await agent
          .post('/messages/add/message')
          .set('Authorization', `Bearer ${token}`)
          .send({ message: { name: 'test message' } });
        messageId = response.body._id;
      } catch (error) {
        throw error;
      }
    });

    it('should delete a message', async () => {
      const response = await agent
        .delete(`/messages/delete/${messageId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(statusCodes.success);
    });

    it('should return 500 if message is not found', async () => {
      const response = await agent
        .delete(`/messages/delete/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(statusCodes.queryError);
      expect(response.body.error).toBe('Failed to delete message');
    });
  });

  describe('GET /messages/:messageId', () => {
    let messageId: string;
    beforeAll(async () => {
      try {
        const response = await agent
          .post('/messages/add/message')
          .set('Authorization', `Bearer ${token}`)
          .send({ message: { name: 'test message' } });
        messageId = response.body._id;
      } catch (error) {
        throw error;
      }
    });

    it('should return a message by id', async () => {
      const response = await agent
        .get(`/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(statusCodes.success);
      expect(response.body.name).toBe('test message');
    });
  });
});
