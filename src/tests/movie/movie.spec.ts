import logger from '../../middleware/winston';
import pool from '../../boot/database/db_connect';
import {
  sampleMovies,
  sampleCategoryMovies,
  sampleMoviesGrouped,
} from './test.data';
import * as moviesController from '../../controllers/movies.controller';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Request, Response } from 'express';

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
describe('Testing movies controller', () => {
  const category = 'Action';

  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Testing getMovies service', () => {
    let req: Request;
    const res: Response = getMockRes().res;

    // Error tests
    it('should log an error when a query error occurs (without category)', async () => {
      req = getMockReq({ query: {} });
      const error = new Error('error');
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(async () => {
          throw error;
        });

      await moviesController.getMovies(req, res);

      expect(poolMock).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching movies',
      });
    });

    it('should log an error when a query error occurs (with category)', async () => {
      req = getMockReq({ query: { category: category } });
      const error = new Error('error');
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(async () => {
          throw error;
        });

      await moviesController.getMovies(req, res);

      expect(poolMock).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching movies',
      });
    });

    // Success tests
    it('should call getMoviesByCategory and return movies by category when category is passed', async () => {
      req = getMockReq({ query: { category: category } });
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(async () => {
          return sampleCategoryMovies;
        });

      await moviesController.getMovies(req, res);

      expect(poolMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        movies: sampleCategoryMovies.rows,
      });
    });

    it('should return all movies grouped when no category is passed', async () => {
      req = getMockReq({ query: {} });

      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(async () => {
          return sampleMovies;
        });

      await moviesController.getMovies(req, res);

      expect(poolMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        movies: sampleMoviesGrouped,
      });
    });
  });

  describe('Testing getTopMovies service', () => {
    let req: Request;
    const res: Response = getMockRes().res;

    // Error tests
    it('should log an error when a query error occurs', async () => {
      req = getMockReq();
      const error = new Error('error');
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(async () => {
          throw error;
        });

      await moviesController.getTopRatedMovies(req, res);

      expect(poolMock).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching top rated movies',
      });
    });

    // Success tests
    it('should return top rated movies', async () => {
      req = getMockReq();
      jest.spyOn(pool, 'query').mockImplementation(async () => {
        return sampleMovies;
      });

      await moviesController.getTopRatedMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        movies: sampleMovies.rows,
      });
    });
  });

  describe('Testing getSeenMovies service', () => {
    let req: Request;
    const res: Response = getMockRes().res;
    const sampleEmail = 'test@test.com';

    // Error tests
    it('should log an error when a query error occurs', async () => {
      req = getMockReq({ user: { email: sampleEmail } });
      const error = new Error('error');
      const poolMock = jest
        .spyOn(pool, 'query')
        .mockImplementation(async () => {
          throw error;
        });

      await moviesController.getSeenMovies(
        req as Request & { user: { email: string } },
        res,
      );

      expect(poolMock).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching seen movies',
      });
    });

    it('should log an error when a user in not present in request', async () => {
      req = getMockReq();

      await moviesController.getSeenMovies(
        req as Request & { user: { email: string } },
        res,
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching seen movies',
      });
    });

    it('should log an error when a email in not present in request', async () => {
      req = getMockReq({ user: {} });

      await moviesController.getSeenMovies(
        req as Request & { user: { email: string } },
        res,
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching seen movies',
      });
    });

    // Success tests
    it('should return user seen movies', async () => {
      req = getMockReq({ user: { email: sampleEmail } });
      jest.spyOn(pool, 'query').mockImplementation(async () => {
        return sampleMovies;
      });

      await moviesController.getSeenMovies(
        req as Request & { user: { email: string } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        movies: sampleMovies.rows,
      });
    });
  });
});
