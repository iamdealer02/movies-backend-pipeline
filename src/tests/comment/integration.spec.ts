import mongoose from 'mongoose';
import { connectToMongoDB } from '../../boot/setup';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { sampleComment } from './test.data';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import * as stausCodes from '../../constants/statusCodes';

let mongodb: MongoMemoryServer;
let app: App;

// setting JWT_SECRET for testing
process.env.JWT_SECRET = 'TEST_SECRET';

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
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongodb.stop();
});

describe('Comment Integration Test', () => {
  const movie_id: string = '12345';
  const invalid_movie_id: string = 'NotANumber';
  let token: string;
  const sampleUser = {
    username: 'test',
    email: 'test@test.com',
    password: 'test',
  };

  beforeAll(async () => {
    try {
      // creating a user that will be used to get a token
      const createUser = await request(app)
        .post('/auth/signup')
        .send(sampleUser);

      // throw error if user creation fails
      if (createUser.status !== 201) {
        throw new Error('Error creating user in beforeAll.');
      }

      // logging in the above created user
      const loginUser = await request(app)
        .post('/auth/login')
        .send({ email: sampleUser.email, password: sampleUser.password });

      // throw error if login fails
      if (loginUser.status !== stausCodes.success) {
        throw new Error('Error logging in user in beforeAll.');
      }

      // setting token for further use
      token = loginUser.body.token;
    } catch (err) {
      throw err;
    }
  });

  describe('Error cases for Adding Comments', () => {
    it('should give unauthorized error when token is not passed in header', async () => {
      const res = await request(app).post(`/comments/${movie_id}`).send({});

      expect(res.status).toBe(stausCodes.unauthorized);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should give validation error for missing fields', async () => {
      const res = await request(app)
        .post(`/comments/${movie_id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(stausCodes.badRequest);
      expect(res.body).toHaveProperty('message', 'Missing parameters');
    });

    it('should give validation error for invalid movie_id', async () => {
      const res = await request(app)
        .post(`/comments/${invalid_movie_id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...sampleComment });

      expect(res.status).toBe(stausCodes.badRequest);
      expect(res.body).toHaveProperty('message', 'Missing parameters');
    });
  });

  describe('Error cases for Getting Comments', () => {
    it('should give unauthorized error when token is not passed in header', async () => {
      const res = await request(app).get(`/comments/${movie_id}`);

      expect(res.status).toBe(stausCodes.unauthorized);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should give validation error for invalid movie_id', async () => {
      const res = await request(app)
        .get(`/comments/${invalid_movie_id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.badRequest);
      expect(res.body).toHaveProperty('message', 'movie id missing');
    });
  });

  describe('Add and Get Comments', () => {
    it('comments for a given movie should be empty initially', async () => {
      const res = await request(app)
        .get(`/comments/${movie_id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.success);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should create a comment for a given movie', async () => {
      const res = await request(app)
        .post(`/comments/${movie_id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...sampleComment });

      expect(res.status).toBe(stausCodes.success);
      expect(res.body).toHaveProperty('message', 'Comment added');
    });

    it('should get above added comment for a given movie', async () => {
      const res = await request(app)
        .get(`/comments/${movie_id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.success);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('movie_id', sampleComment.movie_id);
      expect(res.body[0]).toHaveProperty('title', sampleComment.title);
      expect(res.body[0]).toHaveProperty('comment', sampleComment.comment);
    });
  });
});
