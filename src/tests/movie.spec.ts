import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import rewire from 'rewire';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';
import {
  GroupedMoviesInterface,
  MovieInterface,
} from '../interfaces/movie.interface';
chai.use(sinonChai);
const sandbox = sinon.createSandbox();
let moviesController = rewire('../controllers/movies.controller');

describe('Testing movies controller', () => {
  let sampleMovies: { rows: MovieInterface[] };
  let sampleCategoryMovies: { rows: MovieInterface[] };
  let sampleMoviesGrouped: GroupedMoviesInterface;
  const category = 'Action';

  beforeEach(() => {
    sandbox.stub(logger, 'error').returns(null);
    sandbox.stub(logger, 'info').returns(null);
    sandbox.stub(logger, 'http').returns(null);

    sampleMovies = {
      rows: [
        {
          movie_id: 1,
          title: 'sample 1',
          release_date: '2024-09-22',
          type: 'Action',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
        {
          movie_id: 2,
          title: 'sample 2',
          release_date: '2024-09-24',
          type: 'Action',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
        {
          movie_id: 3,
          title: 'sample 3',
          release_date: '2024-09-22',
          type: 'Comedy',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
        {
          movie_id: 4,
          title: 'sample 4',
          release_date: '2024-09-24',
          type: 'Comedy',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
      ],
    };
    sampleMoviesGrouped = {
      Action: [
        {
          movie_id: 1,
          title: 'sample 1',
          release_date: '2024-09-22',
          type: 'Action',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
        {
          movie_id: 2,
          title: 'sample 2',
          release_date: '2024-09-24',
          type: 'Action',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
      ],
      Comedy: [
        {
          movie_id: 3,
          title: 'sample 3',
          release_date: '2024-09-22',
          type: 'Comedy',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
        {
          movie_id: 4,
          title: 'sample 4',
          release_date: '2024-09-24',
          type: 'Comedy',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
      ],
    };
    sampleCategoryMovies = {
      rows: [
        {
          movie_id: 1,
          title: 'sample 1',
          release_date: '2024-09-22',
          type: 'Action',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
        {
          movie_id: 2,
          title: 'sample 2',
          release_date: '2024-09-24',
          type: 'Action',
          author: '',
          poster: '',
          backdrop_poster: '',
          overview: '',
        },
      ],
    };
  });

  afterEach(() => {
    moviesController = rewire('../controllers/movies.controller');
    sandbox.restore();
  });

  describe('Testing getMovies service', () => {
    let req: { query: { category?: string } };
    let res: { status: sinon.SinonStub };

    beforeEach(() => {
      res = { status: sandbox.stub().returns({ json: sandbox.stub() }) };
    });

    // Error tests
    it('should log an error when a query error occurs (without category)', async () => {
      req = { query: {} };
      const error = new Error('error');
      const poolStub = sandbox.stub(pool, 'query').throws(error);

      await moviesController.getMovies(req, res);

      expect(poolStub).to.have.been.calledOnce;
      expect(poolStub).to.have.thrown(error);
      expect(logger.error).to.have.been.calledWith(error.stack);
      expect(res.status).to.have.been.calledWith(500);
      expect(res.status().json).to.have.been.calledWith({
        error: 'Exception occured while fetching movies',
      });
    });

    it('should log an error when a query error occurs (with category)', async () => {
      req = { query: { category: category } };
      const error = new Error('error');
      const poolStub = sandbox.stub(pool, 'query').throws(error);

      await moviesController.getMovies(req, res);

      expect(poolStub).to.have.been.calledOnce;
      expect(poolStub).to.have.thrown(error);
      expect(logger.error).to.have.been.calledWith(error.stack);
      expect(res.status).to.have.been.calledWith(500);
      expect(res.status().json).to.have.been.calledWith({
        error: 'Exception occured while fetching movies',
      });
    });

    // Success tests
    it('should call getMoviesByCategory and return movies by category when category is passed', async () => {
      req = { query: { category: category } };

      const movieControllerMock = sandbox
        .stub()
        .resolves(sampleCategoryMovies.rows);
      moviesController.__set__('getMoviesByCategory', movieControllerMock);

      await moviesController.getMovies(req, res);

      expect(movieControllerMock).to.have.been.calledWith(category);
      // using 'match.any' to avoid checking the first argument (the query string)
      expect(res.status).to.have.been.calledWith(200);
      expect(res.status().json).to.have.been.calledWith({
        movies: sampleCategoryMovies.rows,
      });
    });

    it('should return all movies grouped when no category is passed', async () => {
      req = { query: {} };

      const poolStub = sandbox.stub(pool, 'query').resolves(sampleMovies);

      await moviesController.getMovies(req, res);
      // using 'match.any' to avoid checking the first argument (the query string)
      expect(poolStub).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.status().json).to.have.been.calledWith({
        movies: sampleMoviesGrouped,
      });
    });
  });
});
