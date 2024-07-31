import request from 'supertest';
import express, { Response, Request, NextFunction } from 'express';
import session from 'express-session';
import * as profileController from '../../controllers/profile.controller';
import { mockResponses, requestData, mockUser } from './test.data';
import verifyToken from '../../middleware/authentication';
import { CustomRequest } from 'src/interfaces/verifyToken.interface';

jest.mock('../../controllers/profile.controller');

// Mock the database connection and logger
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

jest.mock('../../middleware/authentication', () => jest.fn());

describe('Testing profile routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    //  verifyToken middleware should return next() and set req.user
    (verifyToken as jest.Mock).mockImplementation(
      (req: CustomRequest, _res: Response, next: NextFunction) => {
        req.user = {
          email: 'test@gmail.com',
        };
        next();
      },
    ),
      app.use(
        session({
          secret: 'testsecret',
          resave: false,
          saveUninitialized: true,
        }),
      );

    app.post('/profile/logout', profileController.logout);
    app.put('/profile', profileController.editPassword);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /profile', () => {
    const editPasswordMock = profileController.editPassword as jest.Mock;

    it('should return 400 if oldPassword or newPassword is missing', (done) => {
      editPasswordMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(400).json(mockResponses.missingParameters),
      );

      request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${mockUser.email}`)
        .send(requestData.missingParameters)
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual(mockResponses.missingParameters);
          expect(editPasswordMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 400 if oldPassword is equal to newPassword', (done) => {
      editPasswordMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(400).json(mockResponses.samePasswords),
      );

      request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${mockUser.email}`)
        .send(requestData.samePasswords)
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual(mockResponses.samePasswords);
          expect(editPasswordMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 400 if the old password is incorrect', (done) => {
      editPasswordMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(400).json(mockResponses.incorrectPassword),
      );

      request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${mockUser.email}`)
        .send(requestData.incorrectPassword)
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual(mockResponses.incorrectPassword);
          expect(editPasswordMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 500 if there is a query error', (done) => {
      editPasswordMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(500).json(mockResponses.queryError),
      );

      request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${mockUser.email}`)
        .send(requestData.validPasswordChange)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual(mockResponses.queryError);
          expect(editPasswordMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 200 if the password is updated successfully', (done) => {
      editPasswordMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(200).json(mockResponses.passwordUpdated),
      );

      request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${mockUser.email}`)
        .send(requestData.validPasswordChange)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual(mockResponses.passwordUpdated);
          expect(editPasswordMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });

  describe('POST /profile/logout', () => {
    const logoutMock = profileController.logout as jest.Mock;

    it('should delete the user from the session and return 200 status', (done) => {
      logoutMock.mockImplementation(async (_req: Request, res: Response) => {
        return res.status(200).json(mockResponses.disconnected);
      });

      request(app)
        .post('/profile/logout')
        .send()
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toEqual(mockResponses.disconnected);
          expect(logoutMock).toHaveBeenCalledTimes(1);
          done();
        });
    });

    it('should return 200 status even if no user in session', (done) => {
      logoutMock.mockImplementation(async (_req: Request, res: Response) => {
        return res.status(200).json(mockResponses.disconnected);
      });

      request(app)
        .post('/profile/logout')
        .send()
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).toEqual(mockResponses.disconnected);
          expect(logoutMock).toHaveBeenCalledTimes(1);
          done();
        });
    });
  });
});
