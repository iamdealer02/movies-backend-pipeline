import mongoose from 'mongoose';
import { connectToMongoDB } from '../../boot/setup';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import * as statusCodes from '../../constants/statusCodes';
import pool from '../../boot/database/db_connect';
import { sampleRating, invalidRating} from './test.data';

let mongodb: MongoMemoryServer;
let app: App;


// setting JWT_SECRET for testing
process.env.JWT_SECRET = 'TEST_SECRET';

// Mock winston logging
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

beforeAll(async () => {
try {
    mongodb = await MongoMemoryServer.create();
    const uri = mongodb.getUri();
    await connectToMongoDB(uri);
    console.log('Connected to MongoDB successfully');
    app = registerCoreMiddleWare();

    // create the movies table in the test database
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movies (
        movie_id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        rating FLOAT
      );
    `);
    console.log('Movies table created successfully');

  } catch (err) {
    console.error('Error connecting to MongoDB or creating table:', err);
    throw err;
  }
});
  afterAll(async () => {
    await pool.end();
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongodb.stop();
  });



describe('Rating Integration Test', () => {
  const movie_id = 111;
  const invalid_movie_id = 'notNumber';
  const validRating = 4;
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

      if (createUser.status !== 201) {
        throw new Error('Error creating user in beforeAll.');
      }

      const loginUser = await request(app)
        .post('/auth/login')
        .send({ email: sampleUser.email, password: sampleUser.password });

      if (loginUser.status !== statusCodes.success) {
        throw new Error('Error logging in user in beforeAll.');
      }

      // setting token for further use
      token = loginUser.body.token;
        } catch (err) {
        throw err;
        }
    });





    describe('Error cases for Adding Ratings', () => {
        it('should give unauthorized error when token is not passed in header', async () => {
        const res = await request(app)
            .post(`/rating/movies/${movie_id}/rating`)
            .send(sampleRating);

        expect(res.status).toBe(statusCodes.unauthorized);
        expect(res.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should give validation error for missing fields', async () => {
        const res = await request(app)
            .post(`/rating/movies/${movie_id}/rating`)
            .set('Authorization', `Bearer ${token}`)
            .send({}); // No rating

        expect(res.status).toBe(statusCodes.badRequest);
        expect(res.body).toHaveProperty('message', 'Missing parameters');
        });

        it('should give validation error for invalid movie_id', async () => {
        const res = await request(app)
            .post(`/rating/movies/${invalid_movie_id}/rating`)
            .set('Authorization', `Bearer ${token}`)
            .send({movie_id: 'notANumber', rating: 5});

        expect(res.status).toBe(statusCodes.badRequest);
        expect(res.body).toHaveProperty('message', 'Invalid movie_id');
        });

        it('should give validation error for invalid rating value', async () => {
        const res = await request(app)
            .post(`/rating/movies/${movie_id}/rating`)
            .set('Authorization', `Bearer ${token}`)
            .send(invalidRating);

        expect(res.status).toBe(statusCodes.badRequest);
        expect(res.body).toHaveProperty('message', 'Invalid rating');
        });
    });

  describe('Successful Cases for Adding and Retrieving Ratings', () => {
    it('should add a rating and return a success message', async () => {
        const res = await request(app)
          .post(`/rating/movies/${movie_id}/rating`)
          .set('Authorization', `Bearer ${token}`)
          .send({ rating: validRating });


          if (res.status !== statusCodes.success) {
            console.error('Response body:', res.body);
            console.error('Response status:', res.status);
        }
  
        expect(res.status).toBe(statusCodes.success);
        expect(res.body).toHaveProperty('message', 'Rating added');


  });
});
});
