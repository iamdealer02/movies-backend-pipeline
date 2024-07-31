import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import pool from '../../boot/database/db_connect';
import { pg_teardown } from '../helper';
import { pg_setup } from '../helper';

let app: App;
process.env.JWT_SECRET = 'testsecret';

jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

beforeAll(async () => {
  app = registerCoreMiddleWare();
  await pg_setup();
});

afterAll(async () => {
  await pg_teardown();
  await pool.end();
});

describe('User Registration and Login Integration Tests', () => {
  const testUser = {
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'testpassword',
    country: 'TestCountry',
    city: 'TestCity',
    street: 'TestStreet',
    creation_date: new Date(),
  };

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM addresses;');
    await pool.query('DELETE FROM users;');
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/users/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('User created');
    });

    it('should not register an existing user', async () => {
      await request(app)
        .post('/users/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(200);

      const response = await request(app)
        .post('/users/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.message).toBe('User already has an account');
    });

    it('should not register a user with missing parameters', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toBe('Missing parameters');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/users/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should login an existing user', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.username).toBe(testUser.username);
    });

    it('should not login with incorrect credentials', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.message).toBe('Incorrect email/password');
    });

    it('should not login with missing parameters', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toBe('Missing parameters');
    });
  });
});
