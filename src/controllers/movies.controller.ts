import pool from '../boot/database/db_connect';
import logger from 'src/middleware/winston';
import { Request, Response } from 'express';
import { QueryResult, QueryResultRow } from 'pg';
import * as statusCodes from '../constants/statusCodes';
import {
  MovieInterface,
  GroupedMoviesInterface,
} from 'src/interfaces/movie.interface';

const getMovies = async (req: Request, res: Response): Promise<Response> => {
  const { category } = req.query as { category?: string };

  if (category) {
    const result: QueryResultRow[] = await getMoviesByCategory(category);

    return res.status(statusCodes.success).json({ movies: result });
  } else {
    try {
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
    } catch (error) {
      logger.error(error.stack);
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occured while fetching movies' });
    }
  }
};

const getMoviesByCategory = async (
  category: string,
): Promise<QueryResultRow[]> => {
  try {
    const movies: QueryResult = await pool.query(
      'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
      [category],
    );
    return movies.rows;
  } catch (error) {
    logger.error(error.stack);
  }
};

export { getMovies };
