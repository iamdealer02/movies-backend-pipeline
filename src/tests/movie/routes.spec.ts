import request from 'supertest';
import {
  sampleCategoryMovies,
  sampleMovies,
  sampleMoviesGrouped,
} from './test.data';
import { App } from 'supertest/types';
import { Response, Request, NextFunction } from 'express';

import * as moviesController from '../../controllers/movies.controller';
import { registerCoreMiddleWare } from '../../boot/setup';
import verifyToken from '../../middleware/authentication';
import { CustomRequest } from '../../interfaces/verifyToken.interface';
jest.mock('../../controllers/movies.controller');

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

// mock verifyToken middleware
jest.mock('../../middleware/authentication', () => jest.fn());

describe('Testing movies routes', () => {
  let app: App;
  const category = 'Action';
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

  describe('GET /movies', () => {
    const getMoviesMock = moviesController.getMovies as jest.Mock;
    getMoviesMock.mockImplementation(async (_req: Request, res: Response) =>
      res.status(200).json({ movies: sampleMoviesGrouped }),
    );

    it('should return all movies grouped by type', (done) => {
      request(app)
        .get('/movies')
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ movies: sampleMoviesGrouped });
          expect(getMoviesMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return movies by category when a category query is passed', (done) => {
      getMoviesMock.mockImplementation(async (_req: Request, res: Response) =>
        res.status(200).json({ movies: sampleCategoryMovies.rows }),
      );

      request(app)
        .get(`/movies?category=${category}`)
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ movies: sampleCategoryMovies.rows });
          expect(getMoviesMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 500 if error occurs', (done) => {
      getMoviesMock.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(500)
          .json({ error: 'Exception occured while fetching movies' }),
      );

      request(app)
        .get(`/movies`)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            error: 'Exception occured while fetching movies',
          });
          expect(getMoviesMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });

  describe('GET /movies/top', () => {
    const getMoviesTopMock = moviesController.getTopRatedMovies as jest.Mock;
    getMoviesTopMock.mockImplementation(async (_req: Request, res: Response) =>
      res.status(200).json({ movies: sampleMovies.rows }),
    );

    it('should return all movies grouped by type', (done) => {
      request(app)
        .get('/movies/top')
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ movies: sampleMovies.rows });
          expect(getMoviesTopMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 500 if error occurs', (done) => {
      getMoviesTopMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(500).json({
            error: 'Exception occured while fetching top rated movies',
          }),
      );

      request(app)
        .get(`/movies/top`)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            error: 'Exception occured while fetching top rated movies',
          });
          expect(getMoviesTopMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });

  describe('GET /movies/me', () => {
    const getSeenMoviesMock = moviesController.getSeenMovies as jest.Mock;

    it('should return seen movies', (done) => {
      getSeenMoviesMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(200).json({ movies: sampleMovies.rows }),
      );

      request(app)
        .get('/movies/me')
        .set({ Authorization: 'Bearer token' })
        .expect(200)
        .end((err, res) => {
          expect(res.body).toEqual({ movies: sampleMovies.rows });
          expect(getSeenMoviesMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });

    it('should return 500 if error occurs (query or req.user)', (done) => {
      getSeenMoviesMock.mockImplementation(
        async (_req: Request, res: Response) =>
          res.status(500).json({
            error: 'Exception occured while fetching seen movies',
          }),
      );

      request(app)
        .get(`/movies/me`)
        .expect(500)
        .end((err, res) => {
          expect(res.body).toEqual({
            error: 'Exception occured while fetching seen movies',
          });
          expect(getSeenMoviesMock).toHaveBeenCalledTimes(1);
          done(err);
        });
    });
  });
});
