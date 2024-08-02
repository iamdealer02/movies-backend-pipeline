import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import * as stausCodes from '../../constants/statusCodes';
import {
  sampleCategoryMovies,
  sampleMovies,
  sampleMoviesGrouped,
  sampleSeenMovies,
  sampleUser,
} from './test.data';
import {
  pg_add_movies,
  pg_add_seen_movies,
  pg_setup,
  pg_teardown,
} from '../helper';
import pool from '../../boot/database/db_connect';

let app: App;

// setting JWT_SECRET for testing
process.env.JWT_SECRET = 'TEST_SECRET';

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

beforeAll(async () => {
  try {
    app = registerCoreMiddleWare();
    await pg_setup();
    await pg_add_movies(sampleMovies.rows);
  } catch (err) {
    throw err;
  }
});

afterAll(async () => {
  await pg_teardown();
  await pool.end();
});

describe('Movie Integration Test', () => {
  const category: string = 'Action';
  let token: string;

  beforeAll(async () => {
    try {
      // creating a user that will be used to get a token
      const createUser = await request(app)
        .post('/users/register')
        .send(sampleUser);

      // throw error if user creation fails
      if (createUser.status === 200) {
        // logging in the above created user
        const loginUser = await request(app)
          .post('/users/login')
          .send({ email: sampleUser.email, password: sampleUser.password });

        // throw error if login fails
        if (loginUser.status !== stausCodes.success) {
          throw new Error('Error logging in user in beforeAll.');
        }

        // setting token for further use
        token = loginUser.body.token;
      } else {
        throw new Error('Error creating user in beforeAll.');
      }
    } catch (err) {
      throw err;
    }
  });

  describe('Error cases for getMovies', () => {
    it('should give unauthorized error when token is not passed in header', async () => {
      const res = await request(app).get(`/movies`).send({});

      expect(res.status).toBe(stausCodes.unauthorized);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('Error cases for getTopRatedMovies', () => {
    it('should give unauthorized error when token is not passed in header', async () => {
      const res = await request(app).get(`/movies/top`);

      expect(res.status).toBe(stausCodes.unauthorized);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('Error cases for getSeenMovies', () => {
    it('should give unauthorized error when token is not passed in header', async () => {
      const res = await request(app).get(`/movies/me`);

      expect(res.status).toBe(stausCodes.unauthorized);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('Get movies successfully', () => {
    beforeAll(async () => {
      await pg_add_seen_movies([
        { email: sampleUser.email, movie_id: 1 },
        { email: sampleUser.email, movie_id: 2 },
      ]);
    });

    it('GET /movies : fetch all movies successfully', async () => {
      const res = await request(app)
        .get(`/movies`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.success);
      expect(res.body).toHaveProperty('movies');
      expect(res.body.movies).toEqual(
        expect.objectContaining({
          Comedy: expect.arrayContaining(sampleMoviesGrouped.Comedy),
          Action: expect.arrayContaining(sampleMoviesGrouped.Action),
        }),
      );
    });

    it('GET /movies?:category : fetch all movies matching the category successfully', async () => {
      const res = await request(app)
        .get(`/movies?category=${category}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.success);
      expect(res.body).toHaveProperty('movies');
      expect(Array.isArray(res.body.movies)).toBe(true);
      expect(res.body.movies).toEqual(
        expect.arrayContaining(sampleCategoryMovies.rows),
      );
    });

    it('GET /movies/top : fetch all top rated movies successfully', async () => {
      const res = await request(app)
        .get(`/movies/top`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.success);
      expect(res.body).toHaveProperty('movies');
      expect(Array.isArray(res.body.movies)).toBe(true);
      expect(res.body.movies.length).toBeLessThanOrEqual(10);
      expect(res.body.movies.length).toBeGreaterThanOrEqual(0);
    });

    it('GET /movies/me : fetch all top rated movies successfully', async () => {
      const res = await request(app)
        .get(`/movies/me`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(stausCodes.success);
      expect(res.body).toHaveProperty('movies');
      expect(Array.isArray(res.body.movies)).toBe(true);
      expect(res.body.movies).toEqual(sampleSeenMovies.rows);
    });
  });
});
