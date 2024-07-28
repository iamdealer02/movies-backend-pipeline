import logger from '../../middleware/winston';
import { mockResponses, mockUser } from './test.data';
import { getMockReq, getMockRes } from '@jest-mock/express';
import * as profileController from '../../controllers/profile.controller';
import { Request, Response } from 'express';
import session from 'express-session';
import { UserProfile } from 'src/interfaces/profile.interface';

interface CustomSession extends session.Session {
  user?: UserProfile;
}

jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

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

    it('should return 200 status even if no user in session', async () => {
      req.session = {} as CustomSession; // no user in session

      await profileController.logout(req, res);

      expect((req.session as CustomSession).user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponses.disconnected);
    });
  });
});
