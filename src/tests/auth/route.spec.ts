import * as authController from '../../controllers/auth.controller';
import { Response, Request } from 'express';
import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import { jest } from '@jest/globals';
import logger from '../../middleware/winston';
import mongoose from 'mongoose';

// To avoid connecting to the database during testing and to avoid the open db error (openHandle error)
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));
jest.mock('../../controllers/auth.controller');

import { IUser } from 'src/interfaces/user.interface';

describe('Testing auth endpoint', () => {
  let app: App;
  let signInFunc: jest.Mock;

  afterEach(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    app = registerCoreMiddleWare();
    // mocking the logger
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  describe('Post login Route', () => {
    beforeEach(() => {
      signInFunc = authController.signIn as jest.Mock;
    });

    it('should return a token with 200 status code', async () => {
      // mocking the controller function
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

  describe('Post signup Route', () => {
    let app: App;
    let sampleUserValues: {
      username: IUser['username'];
      email: IUser['email'];
      password: IUser['password'];
    };
    let signUpFunc: jest.Mock;

    beforeEach(() => {
      sampleUserValues = {
        username: 'testuser',
        email: 'test@gmail.com',
        password: 'testpassword',
      };
      signUpFunc = authController.signUp as jest.Mock;
      app = registerCoreMiddleWare();
    });

    it('should return the new user with 201 status code', async () => {
      signUpFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(200).json(sampleUserValues),
      );
      const response = await request(app)
        .post('/auth/signup')
        .send(sampleUserValues)
        .expect(200);

      expect(response.body).toEqual(sampleUserValues);
    });

    it('should return 400 status code if email or password is missing', async () => {
      signUpFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ error: 'missing information' }),
      );
      const response = await request(app)
        .post('/auth/signup')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body).toEqual({ error: 'missing information' });
    });
    it('should return 500 status code if server error occurs', async () => {
      signUpFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(500).json({ error: 'Server error' }),
      );
      const response = await request(app)
        .post('/auth/signup')
        .send(sampleUserValues)
        .expect(500);

      expect(response.body).toEqual({ error: 'Server error' });
    });
  });
  describe('Get user Route', () => {
    let app: App;
    let getUserFunc: jest.Mock;
    let sampleUserValues: {
      _id: IUser['_id'];
      email: IUser['email'];
      username: IUser['username'];
      messages: IUser['messages'];
      createdAt: IUser['createdAt'];
      updatedAt: IUser['updatedAt'];
    };

    beforeEach(() => {
      sampleUserValues = {
        _id: new mongoose.Types.ObjectId(),
        email: 'team@gmail.com',
        username: 'team',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      getUserFunc = authController.getUser as jest.Mock;
      app = registerCoreMiddleWare();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return the user with 200 status code', async () => {
      getUserFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(200).json(sampleUserValues),
      );
      // so that there is no error in comparing the response
      const expectedResponse: {
        _id: string;
        email: string;
        username: string;
        messages: string[];
        createdAt: string;
        updatedAt: string;
      } = {
        ...sampleUserValues,
        _id: sampleUserValues._id.toString(),
        messages: sampleUserValues.messages.map((msg) => msg.toString()),
        createdAt: sampleUserValues.createdAt.toISOString(),
        updatedAt: sampleUserValues.updatedAt.toISOString(),
      };
      const response = await request(app).get('/auth/me').expect(200);
      expect(response.body).toEqual(expectedResponse);
    });

    it('should return 500 status code if user is not authenticated', async () => {
      getUserFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(500).json({ error: 'You are not authenticated' }),
      );
      const response = await request(app).get('/auth/me').expect(500);

      expect(response.body).toEqual({ error: 'You are not authenticated' });
    });

    it('should return 500 status code if server error occurs', async () => {
      getUserFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(500).json({ error: 'Failed to get user' }),
      );
      const response = await request(app).get('/auth/me').expect(500);

      expect(response.body).toEqual({ error: 'Failed to get user' });
    });

    it('should return 400 status code if user is not found', async () => {
      getUserFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ message: 'User not found' }),
      );
      const response = await request(app).get('/auth/me').expect(400);

      expect(response.body).toEqual({ message: 'User not found' });
    });
  });
});
