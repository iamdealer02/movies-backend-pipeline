import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Rating } from '../../models/rating.model';
import pool from '../../boot/database/db_connect';
import * as statusCodes from '../../constants/statusCodes';
import logger from '../../middleware/winston';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { addRating } from '../../controllers/rating.controller';
import { mockUser, mockRequestData, mockResponses, mockRatings } from './test.data';

jest.mock('../../models/rating.model');
jest.mock('../../boot/database/db_connect');
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

interface User {
  email: string;
}

interface CustomRequest extends Request {
  user: User;
}

describe('Testing addRating endpoint', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterAll(async () => {
    // Ensure proper cleanup
    await mongoose.disconnect();
    await pool.end();
  });

  describe('POST rating route', () => {
    let req: CustomRequest;
    let res: Response;

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        params: { movieId: '1' },
        body: mockRequestData.validRating,
        user: mockUser,
      });

      res = getMockRes().res;

      jest.clearAllMocks();
    });

    it('should check and return 400 if movieId is not a number', async () => {
      req.params.movieId = 'invalid';

      await addRating(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith(mockResponses.invalidMovieId);
    });


    it('should check and return 400 if rating is not a number', async () => {
      req.body = mockRequestData.invalidRating;

      await addRating(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith(mockResponses.invalidRating);
    });

    it('should return 400 if rating is missing', async () => {
      req.body = mockRequestData.missingRating;

      await addRating(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(res.json).toHaveBeenCalledWith(mockResponses.missingParameters);
    });

    it('should return 200 and add the rating successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      const mockFind = jest.fn().mockResolvedValue(mockRatings);
      (Rating.prototype.save as jest.Mock) = mockSave;
      (Rating.find as jest.Mock) = mockFind;
      const mockQuery = jest.fn().mockResolvedValue({});
      (pool.query as jest.Mock) = mockQuery;

      await addRating(req, res);

      const averageRating = mockRatings.reduce<number>((acc, rating) => acc + rating.rating, 0) / mockRatings.length;

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockFind).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith('UPDATE movies SET rating = $1 WHERE movie_id = $2;', [
        averageRating,
        1,
      ]);
      expect(res.status).toHaveBeenCalledWith(statusCodes.success);
      expect(res.json).toHaveBeenCalledWith(mockResponses.ratingAdded);
    });

    it('should return 500 if there is a query error', async () => {
      const mockSave = jest.fn().mockResolvedValue({});
      const mockFind = jest.fn().mockResolvedValue(mockRatings);
      (Rating.prototype.save as jest.Mock) = mockSave;
      (Rating.find as jest.Mock) = mockFind;
      const mockQuery = jest.fn().mockRejectedValue(new Error('Query error'));
      (pool.query as jest.Mock) = mockQuery;

      await addRating(req, res);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockFind).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(res.json).toHaveBeenCalledWith(mockResponses.queryError);
    });
  });
});
