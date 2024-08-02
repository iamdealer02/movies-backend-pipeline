import logger from '../../middleware/winston';
import pool from '../../boot/database/db_connect';
import { requestData, mockResponses, mockUser } from './test.data';
import { getMockReq, getMockRes } from '@jest-mock/express';
import * as profileController from '../../controllers/profile.controller';
import { Request, Response } from 'express';
import { UserProfile } from 'src/interfaces/profile.interface';
import session from 'express-session';

interface QueryResult {
  rows: Array<{ [key: string]: unknown }>;
}

interface CustomRequest extends Request {
  user: UserProfile;
}

interface CustomSession extends session.Session {
  user?: UserProfile;
}

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

describe('Testing profile controller', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Testing editPassword service', () => {
    let req: CustomRequest;
    const { res } = getMockRes();

    // Error tests
    it('should return 400 if oldPassword or newPassword is missing', async () => {
      req = getMockReq({
        body: requestData.missingParameters,
        user: mockUser,
      });

      await profileController.editPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockResponses.missingParameters);
    });

    it('should return 400 if oldPassword is equal to newPassword', async () => {
      req = getMockReq({
        body: requestData.samePasswords,
        user: mockUser,
      });

      await profileController.editPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockResponses.samePasswords);
    });

    it('should return 400 if the old password is incorrect', async () => {
      req = getMockReq({
        body: requestData.incorrectPassword,
        user: mockUser,
      });

      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(
          (
            _query: string,
            _values: unknown[],
            callback: (error: Error | null, result: QueryResult) => void,
          ) => {
            // Simulate that the old password is incorrect by returning an empty rows array
            callback(null, { rows: [] });
          },
        );

      await profileController.editPassword(req, res);

      expect(poolMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(mockResponses.incorrectPassword);
    });

    it('should return 500 if there is a query error during password check', async () => {
      req = getMockReq({
        body: requestData.validPasswordChange,
        user: mockUser,
      });

      const error = new Error('Query error');
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(
          (
            _query: string,
            _values: unknown[],
            callback: (error: Error | null, result: QueryResult) => void,
          ) => {
            // Simulate a query error during password check
            callback(error, { rows: [] });
          },
        );

      await profileController.editPassword(req, res);
      expect(poolMock).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(mockResponses.queryError);
    });

    it('should return 500 if there is a query error during password update', async () => {
      req = getMockReq({
        body: requestData.validPasswordChange,
        user: mockUser,
      });

      const error = new Error('Query error');
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementationOnce(
          (
            _query: string,
            _values: unknown[],
            callback: (error: Error | null, result: QueryResult) => void,
          ) => {
            // Simulate a successful old password check
            callback(null, { rows: [{ email: mockUser.email }] });
          },
        )
        .mockImplementationOnce(
          (
            _query: string,
            _values: unknown[],
            callback: (error: Error | null, result: QueryResult) => void,
          ) => {
            // Simulate a query error during password update
            callback(error, { rows: [] });
          },
        );

      await profileController.editPassword(req, res);

      expect(poolMock).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(mockResponses.queryError);
    });

    // Success tests
    it('should return 200 if the password is updated successfully', async () => {
      req = getMockReq({
        body: requestData.validPasswordChange,
        user: mockUser,
      });

      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementationOnce(
          (
            _query: string,
            _values: unknown[],
            callback: (error: Error | null, result: QueryResult) => void,
          ) => {
            // Simulate a successful old password check
            callback(null, { rows: [{ email: mockUser.email }] });
          },
        )
        .mockImplementationOnce(
          (
            _query: string,
            _values: unknown[],
            callback: (error: Error | null, result: QueryResult) => void,
          ) => {
            // Simulate a successful password update
            callback(null, { rows: [] });
          },
        );

      await profileController.editPassword(req, res);

      expect(poolMock).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponses.passwordUpdated);
    });
  });

  describe('Testing logout service', () => {
    let req: Request;
    let res: Response;

    beforeEach(() => {
      req = getMockReq({
        session: {
          user: mockUser,
        } as CustomSession,
      });
      res = getMockRes().res;
    });

    it('should delete the user from the session and return 200 status', async () => {
      await profileController.logout(req, res);

      expect((req.session as CustomSession).user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponses.disconnected);
    });
  });
});
