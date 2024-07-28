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
                .send({ })
                .expect(400);
            expect(response.body).toEqual({ error: 'missing information' });
        });
    });

    describe('User Login', () => {
        // Register a user before testing login
        beforeEach(async () => {
            await request(app)
                .post('/auth/signup')
                .send(testUser)
                .expect(201);
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
            expect(response.body).toEqual({ error: "Email or password don't match"  });
        });
    });
  });
  