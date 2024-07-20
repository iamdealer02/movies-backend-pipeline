import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { IUser } from '../../interfaces/user.interface';
import { User } from '../../models/users.model';
import { getMockReq, getMockRes } from '@jest-mock/express';
import * as authController from '../../controllers/auth.controller';
import logger from '../../middleware/winston';
jest.mock('../../middleware/winston', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  };
});

process.env.JWT_SECRET = 'your_test_secret';

interface CustomSession {
  user: {
    _id: mongoose.Types.ObjectId;
    email: string;
  };
}

type CustomRequest = Request & { session: CustomSession };

describe('Testing auth endpoint', () => {
  describe('Post login Route', () => {
    let sampleUserValue: {
      _id: IUser['_id'];
      email: IUser['email'];
      password: IUser['password'];
    };
    let req: CustomRequest;
    let res: Response;
    let FindStub: jest.SpyInstance;
    let CompareStub: jest.SpyInstance;
    let SignStub: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(logger, 'error').mockReturnValue(null);
      jest.spyOn(logger, 'info').mockReturnValue(null);
      jest.spyOn(logger, 'http').mockReturnValue(null);

      sampleUserValue = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@gmail.com',
        password: 'hashedPassword',
      };

      req = getMockReq<CustomRequest>({
        body: {
          email: sampleUserValue.email,
          password: 'password',
        },
        session: {
          user: {
            _id: sampleUserValue._id,
            email: sampleUserValue.email,
          },
        },
      });

      res = getMockRes().res;

      // Spy on mongoose findOne method
      FindStub = jest.spyOn(User, 'findOne').mockResolvedValue(sampleUserValue);

      // Stub the bcrypt compare method to resolve true
      CompareStub = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async () => Promise.resolve(true));

      // Stub the jwt sign method to return a token
      SignStub = jest.spyOn(jwt, 'sign').mockImplementation(() => 'fakeToken');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should verify user credentials and return a token', async () => {
      await authController.signIn(req, res);

      expect(FindStub).toHaveBeenCalledWith({ email: 'test@gmail.com' });
      expect(CompareStub).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(SignStub).toHaveBeenCalledWith(
        { user: { _id: sampleUserValue._id, email: sampleUserValue.email } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'fakeToken',
      });
    });

    it('should return an error if email or password is missing', async () => {
      req.body = {};
      await authController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Please enter all fields',
      });
    });

    it('should return an error if user is not found', async () => {
      FindStub.mockResolvedValue(null);

      await authController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it("should return an error if email or password don't match", async () => {
      CompareStub.mockResolvedValue(false);

      await authController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email or password don't match",
      });
    });

    it('should return an error if server error occurs', async () => {
      FindStub.mockRejectedValue(new Error('Server error'));

      await authController.signIn(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });
});
