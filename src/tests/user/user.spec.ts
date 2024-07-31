import logger from '../../middleware/winston';
import pool from '../../boot/database/db_connect';

import * as userController from '../../controllers/users.controller';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Request, Response } from 'express';
import { IPgUser } from '../../interfaces/pgUser.interface';
import pg, { QueryResult } from 'pg';
import jwt from 'jsonwebtoken';

// To avoid connecting to the database during testing and to avoid the open db error (openHandle error)
jest.mock('../../boot/database/db_connect', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

describe('Testing users controller', () => {
  const sampleUser: IPgUser = {
    email: 'test@gmail.com',
    username: 'test',
    password: 'test',
    country: 'test',
    city: 'test',
    street: 'test',
    creation_date: 'test',
  };

  let client: pg.PoolClient;

  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Testing registerUser service', () => {
    let req: Request;
    const res: Response = getMockRes().res;
    beforeEach(() => {
      // client : query, release
      client = {
        query: jest.fn(),
        release: jest.fn(),
      } as unknown as pg.PoolClient;

      jest.spyOn(pool, 'connect').mockImplementation(async () => client);
      // mock client.release() to avoid the openHandle error
      jest.spyOn(client, 'release').mockImplementation(() => null);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should log an error when a query error occurs', async () => {
      req = getMockReq({ body: sampleUser });
      const error = new Error('Query execution error');

      const poolQueryMock = jest.spyOn(client, 'query');
      poolQueryMock.mockImplementationOnce(async () => {
        throw error;
      });
      poolQueryMock.mockImplementationOnce(async () => {
        return null;
      });

      await userController.registerUser(req, res);

      expect(poolQueryMock).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Exception occurred while registering',
      });
    });

    // email missing test
    it('should return a bad request when email is missing', async () => {
      req = getMockReq({ body: { ...sampleUser, email: undefined } });

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    // username missing test
    it('should return a bad request when username is missing', async () => {
      req = getMockReq({ body: { ...sampleUser, username: undefined } });

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    // password missing test
    it('should return a bad request when password is missing', async () => {
      req = getMockReq({ body: { ...sampleUser, password: undefined } });

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    // country missing test
    it('should return a bad request when country is missing', async () => {
      req = getMockReq({ body: { ...sampleUser, country: undefined } });

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    // user already exists test
    it('should return a user already exists when the user already exists', async () => {
      req = getMockReq({ body: sampleUser });
      const poolQueryMock = jest.spyOn(client, 'query');
      poolQueryMock.mockImplementationOnce(async () => {
        return { rowCount: 1 };
      });

      await userController.registerUser(req, res);

      expect(poolQueryMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User already has an account',
      });
    });

    // user created test
    it('should create a new user', async () => {
      req = getMockReq({ body: sampleUser });
      const poolQueryMock = jest.spyOn(client, 'query');
      poolQueryMock.mockImplementationOnce(async () => {
        return { rowCount: 0 };
      });
      poolQueryMock.mockImplementation(async () => {
        return true;
      });

      await userController.registerUser(req, res);
      // RECEIVE CALLS : begin,user already exist, add user, add address, commit
      expect(poolQueryMock).toHaveBeenCalledTimes(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'User created' });
    });
  });

  describe('Testing login service', () => {
    let req: Request & { session: { user?: { email: string } } };
    let res: Response = getMockRes().res;
    let SignStub: jest.SpyInstance;
    let sampleUser: { email: IPgUser['email']; password: IPgUser['password'] };

    afterEach(() => {
      jest.clearAllMocks();
    });
    beforeEach(() => {
      req = getMockReq({
        body: { email: 'test@gmail.com', password: 'test' },
        session: { user: { email: 'test@gmail.com' } },
      });
      res = getMockRes().res;
      SignStub = jest.spyOn(jwt, 'sign').mockImplementation(() => 'fakeToken');
      sampleUser = { email: 'test@gmail.com', password: 'test' };
    });

    it('should log an error when a query error occurs', async () => {
      let error: Error;
      const poolQueryMock = jest
        .spyOn(pool, 'query')
        .mockImplementation((_, __, callback) => {
          // Simulate an error
          error = new Error('Query execution error');
          callback(error, null);
        });

      await userController.login(req, res);

      expect(poolQueryMock).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while logging in',
      });
      expect(SignStub).not.toHaveBeenCalled();
    });

    // missing email test
    it('should return a bad request when email is missing', async () => {
      req = getMockReq({ body: { ...sampleUser, email: undefined } });

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
      expect(SignStub).not.toHaveBeenCalled();
    });
    // missing password test
    it('should return a bad request when password is missing', async () => {
      req = getMockReq({ body: { ...sampleUser, password: undefined } });

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
      expect(SignStub).not.toHaveBeenCalled();
    });

    // incorrect email/password test
    it('should return a bad request when email/password is incorrect', async () => {
      const mockQueryResult: QueryResult = {
        rows: [], // Simulate no rows found
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
        // Add other properties as needed
      };
      req = getMockReq({ body: { ...sampleUser } });
      const poolQueryMock = jest
        .spyOn(pool, 'query')
        .mockImplementation((_, __, callback) => {
          callback(null, mockQueryResult); // Simulate no rows found
        });

      await userController.login(req, res);

      expect(poolQueryMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Incorrect email/password',
      });
      expect(SignStub).not.toHaveBeenCalled();
    });

    // return token test
    it('should return a token', async () => {
      interface CustomSession {
        user: {
          email: string;
        };
      }

      type CustomRequest = Request & { session: CustomSession };

      const mockQueryResult: QueryResult = {
        rows: [{ ...sampleUser, username: 'test' }], // Simulate a user found
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
        // Add other properties as needed
      };
      req = getMockReq<CustomRequest>({
        body: { ...sampleUser },
        session: { user: { email: sampleUser.email } },
      });

      const poolQueryMock = jest
        .spyOn(pool, 'query')
        .mockImplementation((_, __, callback) => {
          callback(null, mockQueryResult);
        });
      await userController.login(req, res);

      expect(poolQueryMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'fakeToken',
        username: 'test',
      });
      expect(SignStub).toHaveBeenCalledTimes(1);
      expect(SignStub).toHaveBeenCalledWith(
        { user: { email: sampleUser.email } },
        process.env.JWT_SECRET,
        {
          expiresIn: '1h',
        },
      );
    });
  });
});
