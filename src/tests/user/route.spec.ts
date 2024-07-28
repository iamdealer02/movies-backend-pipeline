import * as userController from '../../controllers/users.controller';
import { Request, Response } from 'express';
import { IPgUser } from '../../interfaces/pgUser.interface';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import request from 'supertest';

// Mock controller
jest.mock('../../controllers/users.controller');
// Avoid connecting to the database during testing and avoid the open db error
jest.mock('../../boot/database/db_connect', () => ({
  connect: jest.fn(),
}));

// Avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

describe('Testing auth controller', () => {
  const sampleUser: IPgUser = {
    email: 'test@gmail.com',
    username: 'test',
    password: 'test',
    country: 'test',
    city: 'test',
    street: 'test',
    creation_date: 'test',
  };
  let app: App;

  beforeAll(() => {
    app = registerCoreMiddleWare();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const registerUserMock = userController.registerUser as jest.Mock;

    // Error tests query
    it('should log an error when a query error occurs', (done) => {
      registerUserMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res
            .status(500)
            .json({ message: 'Exception occurred while registering' }),
      );

      request(app)
        .post('/users/register')
        .send(sampleUser)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            message: 'Exception occurred while registering',
          });
          expect(registerUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    // Parameter missing
    it('should return a 400 error when a parameter is missing', (done) => {
      registerUserMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(400).json({ message: 'Missing parameters' }),
      );

      request(app)
        .post('/users/register')
        .send({})
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'Missing parameters' });
          expect(registerUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    // User already exists
    it('should return a 409 error when a user already exists', (done) => {
      registerUserMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(409).json({ message: 'User already has an account' }),
      );

      request(app)
        .post('/users/register')
        .send(sampleUser)
        .expect(409)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'User already has an account' });
          expect(registerUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    // User created
    it('should return a 200 when a user is created', (done) => {
      registerUserMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(200).json({ message: 'User created' }),
      );

      request(app)
        .post('/users/register')
        .send(sampleUser)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'User created' });
          expect(registerUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });

  describe('POST /login', () => {
    const loginUserMock = userController.login as jest.Mock;
    const sampleUserLogin: { email: string; password: string } = {
      email: sampleUser.email,
      password: sampleUser.password,
    };

    // query error
    it('should log an error when a query error occurs', (done) => {
      loginUserMock.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(500)
          .json({ message: 'Exception occurred while logging in' }),
      );

      request(app)
        .post('/users/login')
        .send(sampleUserLogin)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            message: 'Exception occurred while logging in',
          });
          expect(loginUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    // missing parameters
    it('should return a 400 error when a parameter is missing', (done) => {
      loginUserMock.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ message: 'Missing parameters' }),
      );

      request(app)
        .post('/users/login')
        .send({})
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'Missing parameters' });
          expect(loginUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    // email/password incorrect
    it('should return a 404 error when email/password is incorrect', (done) => {
      loginUserMock.mockImplementation(async (_req: Request, res: Response) =>
        res.status(404).json({ message: 'Incorrect email/password' }),
      );

      request(app)
        .post('/users/login')
        .send(sampleUserLogin)
        .expect(404)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'Incorrect email/password' });
          expect(loginUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    // token returned
    it('should return a 200 when a token is returned', (done) => {
      loginUserMock.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(200)
          .json({ token: 'fakeToken', username: sampleUser.username }),
      );

      request(app)
        .post('/users/login')
        .send(sampleUserLogin)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({
            token: 'fakeToken',
            username: sampleUser.username,
          });
          expect(loginUserMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });
});
