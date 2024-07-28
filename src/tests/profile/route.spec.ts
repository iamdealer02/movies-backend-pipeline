import request from 'supertest';
import express, { Response, Request } from 'express';
import session from 'express-session';
import * as profileController from '../../controllers/profile.controller';
import { mockResponses } from './test.data';

jest.mock('../../controllers/profile.controller');


jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));



describe('Testing profile routes', () => {
    let app: express.Application;
  
    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.use(
        session({ secret: 'testsecret', resave: false, saveUninitialized: true }),
      );
      app.post('/profile/logout', profileController.logout);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
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
