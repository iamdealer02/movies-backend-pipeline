import request from 'supertest';
import express from 'express';
import healthRouter from '../../middleware/healthCheck';

const app = express();
app.use(healthRouter);

describe('GET /api/health', () => {
  it('should return a 200 status code and a message', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'All up and running !!');
  });
});
