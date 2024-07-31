import request from 'supertest';

import { App } from 'supertest/types';
import { Response, Request, NextFunction } from 'express';

import * as commentController from '../../controllers/comment.controller';
import { registerCoreMiddleWare } from '../../boot/setup';
import { sampleComments } from './test.data';
import verifyToken from '../../middleware/authentication';
import { CustomRequest } from '../../interfaces/verifyToken.interface';

jest.mock('../../controllers/comment.controller');
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

// mock verifyToken middleware
jest.mock('../../middleware/authentication', () => jest.fn());

describe('Testing comment routes', () => {
  let app: App;
  
  beforeAll(() => {
    app = registerCoreMiddleWare();
    //  verifyToken middleware should return next() and set req.user
    (verifyToken as jest.Mock).mockImplementation(
      (req: CustomRequest, _res: Response, next: NextFunction) => {
        req.user = {
          email: 'test@gmail.com',
        };
        next();
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /comments/:movie_id', () => {
    const addCommentMock = commentController.addComment as jest.Mock;

    it('should create a comment for a given movie successfully', (done) => {
      addCommentMock.mockImplementation(async (_req: Request, res: Response) =>
        res.status(200).json({ message: 'Comment added' }),
      );
      request(app)
        .post('/comments/12345')
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'Comment added' });
          expect(addCommentMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 400 if movie_id is NaN missing or body is empty', (done) => {
      addCommentMock.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ message: 'Missing parameters' }),
      );

      request(app)
        .post(`/comments/nan`)
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'Missing parameters' });
          expect(addCommentMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 500 if query error occurs', (done) => {
      addCommentMock.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(500)
          .json({ error: 'Exception occured while adding comment' }),
      );

      request(app)
        .post(`/comments/12345`)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            error: 'Exception occured while adding comment',
          });
          expect(addCommentMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });

  describe('GET /comments/:movie_id', () => {
    const getCommentsByIdMock = commentController.getCommentsById as jest.Mock;

    it('should get comments for a given movie successfully', (done) => {
      getCommentsByIdMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(200).json(sampleComments),
      );
      request(app)
        .get('/comments/12345')
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual(sampleComments);
          expect(getCommentsByIdMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 400 if movie_id is NaN or missing', (done) => {
      getCommentsByIdMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(400).json({ message: 'movie id missing' }),
      );

      request(app)
        .get(`/comments/nan`)
        .expect(400)
        .end((err, res) => {
          expect(res.body).toEqual({ message: 'movie id missing' });
          expect(getCommentsByIdMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 500 if query error occurs', (done) => {
      getCommentsByIdMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res
            .status(500)
            .json({ error: 'Exception occurred while fetching comments' }),
      );

      request(app)
        .get(`/comments/12345`)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            error: 'Exception occurred while fetching comments',
          });
          expect(getCommentsByIdMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });
});
