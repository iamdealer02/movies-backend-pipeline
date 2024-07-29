import { MovieInterface } from 'src/interfaces/movie.interface';
import pool from '../boot/database/db_connect';

export const pg_setup = async (): Promise<void> => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
      email VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      password VARCHAR(100) NOT NULL,
      creation_date DATE NOT NULL
    );

     CREATE TABLE IF NOT EXISTS addresses (
      email VARCHAR(100) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
      country VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      street VARCHAR(100) NOT NULL
    );

        CREATE TABLE IF NOT EXISTS movies (
                movie_id SERIAL PRIMARY KEY,
                title varchar(80) NOT NULL,
                release_date date NOT NULL,
                rating INT NOT NULL,
                type varchar(50) NOT NULL,
                author varchar(80),
                poster varchar(255),
                backdrop_poster varchar(255),
                overview varchar(500)
            );

        CREATE TABLE IF NOT EXISTS seen_movies (
            email varchar(100) REFERENCES users(email) ON DELETE CASCADE,
            movie_id INT REFERENCES movies(movie_id) ON DELETE CASCADE,
            PRIMARY KEY (email, movie_id)
        );
        
        `);
};

export const pg_add_movies = async (
  movies: MovieInterface[],
): Promise<void> => {
  for (const movie of movies) {
    await pool.query(`
            INSERT INTO movies (title, release_date, rating, type, author, poster, backdrop_poster, overview)
            VALUES ('${movie.title}', '${movie.release_date}', ${movie.rating}, '${movie.type}', '${movie.author}', '${movie.poster}', '${movie.backdrop_poster}', '${movie.overview}');
        `);
  }
};

export const pg_add_seen_movies = async (
  seenMovies: { email: string; movie_id: number }[],
): Promise<void> => {
  for (const seenMovie of seenMovies) {
    await pool.query(`
            INSERT INTO seen_movies (email, movie_id)
            VALUES ('${seenMovie.email}', ${seenMovie.movie_id});
        `);
  }
};

export const pg_teardown = async (): Promise<void> => {
  await pool.query(`
        DROP TABLE IF EXISTS seen_movies;
        DROP TABLE IF EXISTS addresses;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS movies;
        `);
};
