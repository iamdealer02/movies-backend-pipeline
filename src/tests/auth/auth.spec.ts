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
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

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
  describe('Post signup Route', () => {
    let req: Request;
    let res: Response;
    let CreateStub: jest.SpyInstance;
    let HashStub: jest.SpyInstance;
    const sampleUserValues: {
      username: IUser['username'];
      email: IUser['email'];
      password: IUser['password'];
    } = {
      email: 'test@gmail.com',
      password: 'password',
      username: 'test',
    };
    beforeEach(() => {
      req = getMockReq<Request>({
        body: { ...sampleUserValues },
      });
      res = getMockRes().res;
      // save method
      CreateStub = jest.spyOn(User.prototype, 'save').mockResolvedValue({
        ...sampleUserValues,
        password: 'hashedPassword',
      });
      // hash method
      HashStub = jest
        .spyOn(bcrypt, 'hashSync')
        .mockReturnValue('hashedPassword');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a new user', async () => {
      await authController.signUp(req, res);

      expect(HashStub).toHaveBeenCalledWith('password', 10);
      expect(CreateStub).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        password: 'hashedPassword',
        username: 'test',
      });
    });
    // missing information
    it('should return an error if missing information', async () => {
      req.body = {};
      await authController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });
    // failed to save user
    it('should return an error if failed to save user', async () => {
      CreateStub.mockRejectedValue(new Error('failed to save user'));

      await authController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'failed to save user' });
    });
  });
  describe('Get user Route', () => {
    // user details from _id saved in session
    let req: CustomRequest;
    let res: Response;
    let FindStub: jest.SpyInstance;
    const sampleUserValue: {
      _id: IUser['_id'];
      email: IUser['email'];
      username: IUser['username'];
      messages: IUser['messages'];
      createdAt: IUser['createdAt'];
      updatedAt: IUser['updatedAt'];
    } = {
      _id: new mongoose.Types.ObjectId(),
      email: 'team@gmail.com',
      username: 'team',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        session: {
          user: {
            _id: sampleUserValue._id,
            email: sampleUserValue.email,
          },
        },
      });

      res = getMockRes().res;

      FindStub = jest
        .spyOn(User, 'findById')
        .mockResolvedValue(sampleUserValue);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should give 500 authenticaion error', async () => {
      req.session.user = null;
      await authController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not authenticated',
      });
    });
    it('should return user details', async () => {
      await authController.getUser(req, res);

      expect(FindStub).toHaveBeenCalledWith(sampleUserValue._id, {
        password: 0,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sampleUserValue);
    });
    it('should return an error if user is not found', async () => {
      FindStub.mockResolvedValue(null);

      await authController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
    it('should return an error if mongoose fails', async () => {
      FindStub.mockRejectedValue(new Error('Failed to get user'));

      await authController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get user' });
    });
  });
});
