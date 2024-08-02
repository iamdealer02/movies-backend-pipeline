import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import { jest } from '@jest/globals';
// creating an in memory mongodb server
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToMongoDB } from '../../boot/setup';
import mongoose from 'mongoose';
import pool from '../../boot/database/db_connect';
import request from 'supertest';

let mongodb: MongoMemoryServer;
let app: App;
process.env.JWT_SECRET = 'testsecret';

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

beforeAll(async () => {
  try {
    mongodb = await MongoMemoryServer.create();
    const uri = mongodb.getUri();
    connectToMongoDB(uri);
    app = registerCoreMiddleWare();
  } catch (err) {
    throw err;
  }
});

afterAll(async () => {
  await pool.end();
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongodb.stop();
});

describe('User Registration and Login Integration Tests', () => {
  const testUser = {
    email: 'test@gmail.com',
    username: 'testuser',
    password: 'testpassword',
  };
  afterEach(async () => {
    // delete mongodb collections
    await mongoose.connection.dropDatabase();
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(testUser)
        .expect(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('password');
      // expect a hashed password
      expect(response.body.password).not.toEqual(testUser.password);
    });

    it('should return 400 status code if email or password is missing', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({})
        .expect(400);
      expect(response.body).toEqual({ error: 'missing information' });
    });
  });

  describe('User Login', () => {
    // Register a user before testing login
    beforeEach(async () => {
      await request(app).post('/auth/signup').send(testUser).expect(201);
    });
    it('should login a user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send(testUser)
        .expect(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 status code if email or password is incorrect', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(400);
      expect(response.body).toEqual({ error: "Email or password don't match" });
    });
  });
  describe('User Profile', () => {
    let sessionCookie: string; // To store the session cookie
    beforeEach(async () => {
      // Register a user and store the session cookie
      await request(app).post('/auth/signup').send(testUser).expect(201);

      // Log in the user and store the session cookie
      const loginResponse = await request(app)
        .post('/auth/login')
        .send(testUser)
        .expect(200);

      // Extract session cookie from response headers
      sessionCookie = loginResponse.headers['set-cookie'];
    });

    it('should return 401 status code if user is not authenticated', async () => {
      const response = await request(app).get('/users/profile').expect(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return user profile if user is authenticated', async () => {
      // Use the session cookie to make an authenticated request to /auth/me
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('messages', []);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
      expect(response.body).toHaveProperty('_id');
      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('User Logout', () => {
    let sessionCookie: string;
    beforeEach(async () => {
      // Register a user
      await request(app).post('/auth/signup').send(testUser).expect(201);

      // Log in the user
      await request(app).post('/auth/login').send(testUser).expect(200);
    });
    // it should logout the user and delete the session.user
    it('should logout the user', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send(testUser)
        .expect(200);
      sessionCookie = loginResponse.headers['set-cookie'];
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);
      expect(response.body).toEqual({ message: 'Disconnected' });
    });
  });
});
