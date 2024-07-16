import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
// import rewire from 'rewire';
import logger from '../../middleware/winston';
import pool from '../../boot/database/db_connect';
import request from 'supertest';
import {
  GroupedMoviesInterface,
  MovieInterface,
} from '../../interfaces/movie.interface';
import { App } from 'supertest/types';
import rewire from 'rewire';

const sandbox = sinon.createSandbox();
chai.use(sinonChai);
let registerCoreMiddleWare = rewire('../../boot/setup').registerCoreMiddleWare;

describe('Testing movies routes', () => {
  let sampleMovies: { rows: MovieInterface[] };
  let sampleCategoryMovies: { rows: MovieInterface[] };
  let sampleMoviesGrouped: GroupedMoviesInterface;
  let app: App;
  const category = 'Action';

  beforeEach(() => {
    sandbox.stub(logger, 'error').returns(null);
    sandbox.stub(logger, 'info').returns(null);
    sandbox.stub(logger, 'http').returns(null);

    app = registerCoreMiddleWare();
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
    sandbox.restore();
    registerCoreMiddleWare = rewire('../../boot/setup').registerCoreMiddleWare;
  });

  describe('GET /movies', () => {
    it('should return all movies grouped by type', async () => {
      const poolStub = sandbox.stub(pool, 'query').resolves(sampleMovies);
      const res = await request(app).get('/movies');
      expect(res.status).to.be.equal(200);
      expect(res.body).to.be.deep.equal({ movies: sampleMoviesGrouped });
      expect(poolStub).to.have.been.calledOnce;
    });

    it('should return movies by category', async () => {
      const poolStub = sandbox
        .stub(pool, 'query')
        .resolves(sampleCategoryMovies);
      const res = await request(app).get('/movies').query({ category });
      expect(res.status).to.be.equal(200);
      expect(res.body).to.be.deep.equal({ movies: sampleCategoryMovies.rows });
      expect(poolStub).to.have.been.calledOnceWith(sinon.match.any, [category]);
    });

    it('should return 500 if error occurs', async () => {
      const poolStub = sandbox
        .stub(pool, 'query')
        .throws(new Error('Error occurred'));
      const res = await request(app).get('/movies');
      expect(res.status).to.be.equal(500);
      expect(res.body).to.be.deep.equal({
        error: 'Exception occured while fetching movies',
      });
      expect(poolStub).to.have.been.calledOnce;
    });
  });

  describe('GET /movies/top', () => {
    it('should return top rated movies', async () => {
      const poolStub = sandbox.stub(pool, 'query').resolves(sampleMovies);
      const res = await request(app).get('/movies/top');
      expect(res.status).to.be.equal(200);
      expect(res.body).to.be.deep.equal({ movies: sampleMovies.rows });
      expect(poolStub).to.have.been.calledOnce;
    });

    it('should return 500 if error occurs', async () => {
      const poolStub = sandbox
        .stub(pool, 'query')
        .throws(new Error('Error occurred'));
      const res = await request(app).get('/movies/top');
      expect(res.status).to.be.equal(500);
      expect(res.body).to.be.deep.equal({
        error: 'Exception occured while fetching top rated movies',
      });
      expect(poolStub).to.have.been.calledOnce;
    });
  });
});
