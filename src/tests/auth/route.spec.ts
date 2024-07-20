import * as authController from '../../controllers/auth.controller';
import { Response, Request } from 'express';
import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import { jest } from '@jest/globals';
import logger from '../../middleware/winston';


// To avoid connecting to the database during testing and to avoid the open db error (openHandle error)
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

;

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));
jest.mock('../../controllers/auth.controller');

import mongoose from 'mongoose';

// to avoid the openHandle error
afterAll(async () => {
  await mongoose.connection.close();
})

describe('Testing auth endpoint', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Post login Route', () => {
    let app: App;

    beforeEach(() => {
      app = registerCoreMiddleWare();
      // mocking the logger
      jest.spyOn(logger, 'error').mockReturnValue(null);
      jest.spyOn(logger, 'info').mockReturnValue(null);
      jest.spyOn(logger, 'http').mockReturnValue(null);
    });

    it('should return a token with 200 status code', async () => {
      // mocking the controller function
      const signInFunc = authController.signIn as jest.Mock;
      signInFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(200).json({ token: 'fakeToken' }),
      );

      // hit the route and check the response
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(200);

      expect(response.body).toEqual({ token: 'fakeToken' });
    });

    it('should return 400 status code if email or password is missing', async () => {
      const signInFunc = authController.signIn as jest.Mock;
      signInFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ error: 'Please enter all fields' }),
      );
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Please enter all fields' });
    });
    it('should return 400 status code if user is not found', async () => {
      const signInFunc = authController.signIn as jest.Mock;
      signInFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ error: 'User not found' }),
      );
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(400);

      expect(response.body).toEqual({ error: 'User not found' });
    });
    it('should return 400 status code if email or password do not match', async () => {
      const signInFunc = authController.signIn as jest.Mock;
      signInFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ error: 'Email or password do not match' }),
      );
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Email or password do not match',
      });
    });
    it('should return 500 status code if server error occurs', async () => {
      const signInFunc = authController.signIn as jest.Mock;
      signInFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(500).json({ error: 'Server error' }),
      );
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'testpassword' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Server error' });
    });
  });
});
