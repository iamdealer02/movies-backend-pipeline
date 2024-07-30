import request from 'supertest';
import { App } from 'supertest/types';
import { Response, Request, NextFunction } from 'express';
import * as ratingController from '../../controllers/rating.controller';
import { registerCoreMiddleWare } from '../../boot/setup';
import { jest } from '@jest/globals';
import verifyToken from '../../middleware/authentication';
import { CustomRequest } from '../../interfaces/verifyToken.interface';

// Mock dependencies
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

jest.mock('../../controllers/rating.controller');
jest.mock('../../middleware/authentication', () => jest.fn());

describe('Testing rating routes', () => {
  let app: App;

  beforeAll(() => {
    app = registerCoreMiddleWare() as App;
    //  verifyToken middleware should return next() and set req.user
    (verifyToken as jest.Mock).mockImplementation(
      (req: CustomRequest, _res: Response, next: NextFunction) => {
        req.user = {
           email: 'test@test.com' }; 
        next();
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /movies/:movieId/rating', () => {
    const addRatingMock = ratingController.addRating as jest.Mock;

    it('should return 200 with success message on valid request', async () => {
      addRatingMock.mockImplementation(async (_req: Request, res: Response) => 
        res.status(200).json({ message: 'Rating added' })
      );

      const response = await request(app)
        .post('/rating/movies/111/rating')
        .send({ rating: 5 })
        .expect(200);

      expect(response.body).toEqual({ message: 'Rating added' });
  
    });

    it('should return 400 if rating is missing', async () => {
      addRatingMock.mockImplementation(async (_req: Request, res: Response) => 
        res.status(400).json({ message: 'Missing parameters' })
      );

      const response = await request(app)
        .post('/rating/movies/111/rating')
        .send({}) // no rating
        .expect(400);

      expect(response.body).toEqual({ message: 'Missing parameters' });
      expect(addRatingMock).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if movieId is invalid', async () => {
      addRatingMock.mockImplementation(async (_req: Request, res: Response) => 
        res.status(400).json({ message: 'Missing parameters' })
      );

      const response = await request(app)
        .post('/rating/movies/invalid/rating') // Invalid movieId
        .send({ rating: 5 })
        .expect(400);

      expect(response.body).toEqual({ message: 'Missing parameters' });
      expect(addRatingMock).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if server error occurs', async () => {
      addRatingMock.mockImplementation(async (_req: Request, res: Response) => 
        res.status(500).json({ error: 'Exception occurred while adding rating' })
      );

      const response = await request(app)
        .post('/rating/movies/123/rating')
        .send({ rating: 5 })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Exception occurred while adding rating',
      });
      expect(addRatingMock).toHaveBeenCalledTimes(1);
    });
  });
});