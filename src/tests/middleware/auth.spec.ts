import jwt from 'jsonwebtoken';
import verifyToken from '../../middleware/authentication';
import { getMockReq, getMockRes } from '@jest-mock/express';
import logger from '../../middleware/winston';
import {
  CustomRequest,
  DecodedToken,
} from '../../interfaces/verifyToken.interface';

jest.mock('../../middleware/winston', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  };
});

process.env.JWT_SECRET = 'your_test_secret';

describe('Testing verifyToken middleware', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if token is not provided', () => {
    const req = getMockReq<CustomRequest>({
      header: jest.fn().mockReturnValue(null),
    });
    const { res, next } = getMockRes();
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 if invalid token is provided', () => {
    const req = getMockReq<CustomRequest>({
      header: jest.fn().mockReturnValue('Bearer invalid_token'),
    });
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const { res, next } = getMockRes();
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(logger.error).toHaveBeenCalled();
    expect(jwt.verify).toHaveBeenCalledWith(
      'invalid_token',
      'your_test_secret',
    );
  });

  it('should call next if valid token is provided and contains user value', () => {
    const token = 'Bearer valid_token';
    const decodedToken: DecodedToken = {
      user: {
        email: 'test@gmail.com',
      },
    };
    const req = getMockReq<CustomRequest>({
      header: jest.fn().mockReturnValue(token),
    });
    const { res, next } = getMockRes();
    jest.spyOn(jwt, 'verify').mockImplementation(() => decodedToken);
    verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(decodedToken.user);
    expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'your_test_secret');
  });

  it('should return 401 if the token does not contain a user', () => {
    const token = 'Bearer valid_token';
    const decoded = { notUser: 'invalid' };
    const req = getMockReq<CustomRequest>({
      header: jest.fn().mockReturnValue(token),
    });
    const { res, next } = getMockRes();
    jest.spyOn(jwt, 'verify').mockImplementation(() => decoded);

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
