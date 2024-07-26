import request from 'supertest';
import { Response, Request } from 'express';
import { App } from 'supertest/types';
import * as profileController from '../../controllers/profile.controller';
import { registerCoreMiddleWare } from '../../boot/setup';
import { mockResponses, requestData, mockUser } from './test.data';

jest.mock('../../controllers/profile.controller');

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

describe('Testing profile routes', () => {
  let app: App;

  beforeAll(() => {
    app = registerCoreMiddleWare();
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
});
