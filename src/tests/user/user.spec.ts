import logger from '../../middleware/winston';
import pool from '../../boot/database/db_connect';

import * as userController from '../../controllers/users.controller';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Request, Response } from 'express';
import { IPgUser } from '../../interfaces/pgUser.interface';
import pg from 'pg';

// To avoid connecting to the database during testing and to avoid the open db error (openHandle error)
jest.mock('../../boot/database/db_connect', () => ({
  connect: jest.fn(),
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

  describe('Testing registerUser service', () => {
    let req: Request;
    const res: Response = getMockRes().res;

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
});
