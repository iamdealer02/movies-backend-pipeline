import request from 'supertest';
import express from 'express';
import logger from '../../middleware/winston';
import notFoundMiddleware from '../../middleware/notFound';

// mock the logger
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

describe('Not Found Middleware', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(notFoundMiddleware);
  });

  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 and error message for non-existing routes', async () => {
    const res = await request(app).get('/non-existing-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', { message: 'Not Found' });
  });
});
