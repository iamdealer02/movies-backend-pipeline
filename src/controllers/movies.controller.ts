import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import { Request, Response } from 'express';
import { QueryResult, QueryResultRow } from 'pg';
import * as statusCodes from '../constants/statusCodes';
import {
  MovieInterface,
  GroupedMoviesInterface,
} from '../interfaces/movie.interface';

const getMovies = async (req: Request, res: Response): Promise<Response> => {
  const { category } = req.query as { category?: string };

  try {
    if (category) {
      const result: QueryResultRow[] = await getMoviesByCategory(category);

      return res.status(statusCodes.success).json({ movies: result });
    } else {
      const movies: QueryResult = await pool.query(
        'SELECT * FROM movies GROUP BY type, movie_id;',
      );

      const groupedMovies: GroupedMoviesInterface = movies.rows.reduce(
        (acc: GroupedMoviesInterface, movie: MovieInterface) => {
          const { type } = movie;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(movie);
          return acc;
        },
        {},
      );
      return res.status(statusCodes.success).json({ movies: groupedMovies });
    }
  } catch (error) {
    logger.error(error.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching movies' });
  }
};

// Here the try-catch block was removed and the getMovies handles the error in its own try catch. This was to include the query error response on failure of the below function
const getMoviesByCategory = async (
  category: string,
): Promise<QueryResultRow[]> => {
  const movies: QueryResult = await pool.query(
    'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
    [category],
  );
  return movies.rows;
};

export { getMovies };
