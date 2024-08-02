import { Request, Response } from 'express';
import logger from '../middleware/winston';
import { IRating } from '../interfaces/rating.interface';
import { Rating } from '../models/rating.model';
import * as statusCodes from '../constants/statusCodes';
import pool from '../boot/database/db_connect';

interface User {
  email: string;
}

interface RequestWithUser extends Request {
  user: User;
}

const addRating = async (
  req: RequestWithUser,
  res: Response,
): Promise<void> => {
  const { movieId } = req.params;
  const { rating } = req.body;

  const movie_id = parseInt(movieId);

  if (isNaN(movie_id) || !rating) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  } else {
    try {
      const ratingObj = new Rating({
        email: req.user.email,
        movie_id,
        rating,
      });

      await ratingObj.save();

      const ratings: IRating[] = await Rating.find({}, { rating: 1 });

      const totalRatings = ratings.reduce<number>(
        (acc, current) => acc + current.rating,
        0,
      );
      const averageRating = totalRatings / ratings.length;

      await pool.query('UPDATE movies SET rating = $1 WHERE movie_id = $2;', [
        averageRating,
        movie_id,
      ]);

      res.status(statusCodes.success).json({ message: 'Rating added' });
    } catch (error) {
      logger.error(error.stack);
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while adding rating' });
    }
  }
};

export { addRating };
