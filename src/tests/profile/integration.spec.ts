import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import pool from '../../boot/database/db_connect';
import { pg_teardown, pg_setup } from '../helper';

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

describe('Profile integration Tests', () => {
  const testUser = {
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'testPassword',
    country: 'TestCountry',
    city: 'TestCity',
    street: 'TestStreet',
    creation_date: new Date(),
  };

  let token: string;

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM addresses;');
    await pool.query('DELETE FROM users;');

    // Register user
    await request(app)
      .post('/users/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(200);

    // Login user
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect('Content-Type', /json/)
      .expect(200);

    token = loginResponse.body.token;
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  describe('Edit Password', () => {
    it('should edit the password successfully', async () => {
      const response = await request(app)
        .put('/profile/editPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'testPassword',
          newPassword: 'newPassword',
        })
        .expect('Content-Type', /json/)
        .expect(200);
      expect(response.body.message).toBe('Password updated');

      // verify login with new password
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: 'newPassword',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.username).toBe(testUser.username);
    });

    it('should not edit the password if the old password is incorrect', async () => {
      const response = await request(app)
        .put('/profile/editPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'oldPassword',
          newPassword: 'notOldPassword',
        })
        .expect('Content-Type', /json/)
        .expect(400);
      expect(response.body.message).toBe('Incorrect password');
    });

    it('should not edit the password if the new password is equal to the old password', async () => {
      const response = await request(app)
        .put('/profile/editPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: 'oldPassword',
          newPassword: 'oldPassword',
        })
        .expect('Content-Type', /json/)
        .expect(400);
      expect(response.body.message).toBe(
        'New password cannot be equal to old password',
      );
    });

    it('should return error if the new password or the old password is missing', async () => {
      const response = await request(app)
        .put('/profile/editPassword')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: '',
          newPassword: '',
        })
        .expect('Content-Type', /json/)
        .expect(400);
      expect(response.body.message).toBe('Missing parameters');
    });
  });

  describe('Logout', () => {
    it('should logout the user successfully', async () => {
      const response = await request(app)
        .post('/profile/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.message).toBe('Disconnected');
    });
  });
});
