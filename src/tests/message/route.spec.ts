import * as messageController from '../../controllers/messages.controller';
import { IMessage } from '../../interfaces/message.interface';
import { Response, Request } from 'express';
import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import { App } from 'supertest/types';
import { jest } from '@jest/globals';
import logger from '../../middleware/winston';
import mongoose from 'mongoose';

// To avoid connecting to the database during testing and to avoid the open db error (openHandle error)
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));
jest.mock('../../controllers/messages.controller');

describe('testing messages route', () => {
  let app: App;
  let sampleMessageValue: {
    name: IMessage['name'];
    user: IMessage['user'];
  };
  let addFunc: jest.Mock;
  let editFunc: jest.Mock;

  afterEach(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    app = registerCoreMiddleWare();
    // mocking the logger
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  describe('post add message route', () => {
    beforeEach(() => {
      sampleMessageValue = {
        name: 'mock name',
        user: new mongoose.Types.ObjectId(),
      };
      addFunc = messageController.addMessage as jest.Mock;
    });

    it('should return the new user with 201 status code', async () => {
      const mockResponse = {
        ...sampleMessageValue,
        user: sampleMessageValue.user.toHexString(),
      };

      addFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(201).json(mockResponse),
      );
      const response = await request(app)
        .post('/messages/add/message')
        .send(mockResponse)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 400 status code if name or user is missing', async () => {
      addFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ error: 'Please enter all fields' }),
      );
      const response = await request(app)
        .post('/messages/add/message')
        .send({ user: sampleMessageValue.user })
        .expect(400);

      expect(response.body).toEqual({ error: 'Please enter all fields' });
    });

    it('should return 500 status code if server error', async () => {
      addFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(500).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .post('/messages/add/message')
        .send(sampleMessageValue)
        .expect(500);

      expect(response.body).toEqual({ error: 'Server Error' });
    });
  });

  describe('put edit message route', () => {
    beforeEach(() => {
      sampleMessageValue = {
        name: 'mock name',
        user: new mongoose.Types.ObjectId(),
      };
      editFunc = messageController.editMessage as jest.Mock;
    });

    it('should return the updated message with 200 status code', async () => {
      const mockResponse = {
        ...sampleMessageValue,
        user: sampleMessageValue.user.toHexString(),
      };

      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(200).json(mockResponse),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send(mockResponse)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 400 status code if name or messageId is missing', async () => {
      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(400).json({ error: 'Please enter all fields' }),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send({ user: sampleMessageValue.user })
        .expect(400);

      expect(response.body).toEqual({ error: 'Please enter all fields' });
    });

    it('should return 404 status code if message is not found', async () => {
      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(404).json({ error: 'Message not found' }),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send(sampleMessageValue)
        .expect(404);

      expect(response.body).toEqual({ error: 'Message not found' });
    });

    it('should return 500 status code if server error', async () => {
      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(500).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send(sampleMessageValue)
        .expect(500);

      expect(response.body).toEqual({ error: 'Server Error' });
    });
  });
});