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

const getTopRatedMovies = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const movies: QueryResult = await pool.query(
      'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;',
    );
    return res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error) {
    logger.error(error.stack);
    return res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching top rated movies' });
  }
};

const getSeenMovies = async (
  req: Request & { user: { email: string } },
  res: Response,
): Promise<Response> => {
  try {
    const movies: QueryResult = await pool.query(
      'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
      [req.user.email],
    );
    return res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error) {
    logger.error(error.stack);
    return res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching seen movies' });
  }
};

export { getMovies, getTopRatedMovies, getSeenMovies };
