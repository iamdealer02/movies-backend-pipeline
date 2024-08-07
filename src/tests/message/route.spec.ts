import * as messageController from '../../controllers/messages.controller';
import { IMessage } from '../../interfaces/message.interface';
import { Response, Request, NextFunction } from 'express';
import request from 'supertest';
import { registerCoreMiddleWare } from '../../boot/setup';
import verifyToken from '../../middleware/authentication';
import { CustomRequest } from '../../interfaces/verifyToken.interface';
import { App } from 'supertest/types';
import { jest } from '@jest/globals';
import logger from '../../middleware/winston';
import mongoose from 'mongoose';
import * as statusCodes from '../../constants/statusCodes';

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
jest.mock('../../middleware/authentication', () => jest.fn());

describe('testing messages route', () => {
  let app: App;
  let sampleMessageValue: {
    name: IMessage['name'];
    user: IMessage['user'];
  };
  let addFunc: jest.Mock;
  let getByIdFunc: jest.Mock;
  let deleteFunc: jest.Mock;
  let editFunc: jest.Mock;
  let getFunc: jest.Mock;

  beforeAll(() => {
    app = registerCoreMiddleWare();
    //  verifyToken middleware should return next() and set req.user
    (verifyToken as jest.Mock).mockImplementation(
      (req: CustomRequest, _res: Response, next: NextFunction) => {
        req.user = {
          email: 'test@gmail.com',
        };
        next();
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // mocking the logger
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  describe('POST add message route', () => {
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
        res.status(statusCodes.created).json(mockResponse),
      );
      const response = await request(app)
        .post('/messages/add/message')
        .send(mockResponse)
        .expect(statusCodes.created);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 400 status code if name or user is missing', async () => {
      addFunc.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(statusCodes.badRequest)
          .json({ error: 'Please enter all fields' }),
      );
      const response = await request(app)
        .post('/messages/add/message')
        .send({ user: sampleMessageValue.user })
        .expect(statusCodes.badRequest);

      expect(response.body).toEqual({ error: 'Please enter all fields' });
    });

    it('should return 500 status code if server error', async () => {
      addFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.queryError).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .post('/messages/add/message')
        .send(sampleMessageValue)
        .expect(statusCodes.queryError);

      expect(response.body).toEqual({ error: 'Server Error' });
    });
  });

  describe('GET get messages route ', () => {
    beforeEach(() => {
      getFunc = messageController.getMessages as jest.Mock;
    });

    it('should return all messages with 200 status code', async () => {
      const mockResponse = [
        {
          name: 'mock name',
          user: new mongoose.Types.ObjectId().toHexString(),
        },
      ];

      getFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.success).json(mockResponse),
      );
      const response = await request(app)
        .get('/messages')
        .expect(statusCodes.success);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 500 status code if server error', async () => {
      getFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.queryError).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .get('/messages')
        .expect(statusCodes.queryError);

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
        res.status(statusCodes.success).json(mockResponse),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send(mockResponse)
        .expect(statusCodes.success);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 400 status code if name or messageId is missing', async () => {
      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(statusCodes.badRequest)
          .json({ error: 'Please enter all fields' }),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send({ user: sampleMessageValue.user })
        .expect(statusCodes.badRequest);

      expect(response.body).toEqual({ error: 'Please enter all fields' });
    });

    it('should return 404 status code if message is not found', async () => {
      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.notFound).json({ error: 'Message not found' }),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send(sampleMessageValue)
        .expect(statusCodes.notFound);

      expect(response.body).toEqual({ error: 'Message not found' });
    });

    it('should return 500 status code if server error', async () => {
      editFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.queryError).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .put(`/messages/edit/${sampleMessageValue.user}`)
        .send(sampleMessageValue)
        .expect(statusCodes.queryError);

      expect(response.body).toEqual({ error: 'Server Error' });
    });
  });

  describe('delete delete message route', () => {
    beforeEach(() => {
      deleteFunc = messageController.deleteMessage as jest.Mock;
    });

    it('should return 200 status code if message is deleted', async () => {
      const mockMessageId = new mongoose.Types.ObjectId().toHexString();

      deleteFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.success).json({ message: 'message deleted' }),
      );
      const response = await request(app)
        .delete(`/messages/delete/${mockMessageId}`)
        .expect(statusCodes.success);

      expect(response.body).toEqual({ message: 'message deleted' });
    });

    it('should return 400 status code if message id is missing', async () => {
      const mockMessageId = new mongoose.Types.ObjectId().toHexString();

      deleteFunc.mockImplementation(async (_req: Request, res: Response) =>
        res
          .status(statusCodes.badRequest)
          .json({ error: 'Please enter all fields' }),
      );
      const response = await request(app)
        .delete(`/messages/delete/${mockMessageId}`)
        .expect(statusCodes.badRequest);

      expect(response.body).toEqual({ error: 'Please enter all fields' });
    });

    it('should return 500 status code if server error', async () => {
      const mockMessageId = new mongoose.Types.ObjectId().toHexString();

      deleteFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.queryError).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .delete(`/messages/delete/${mockMessageId}`)
        .expect(statusCodes.queryError);

      expect(response.body).toEqual({ error: 'Server Error' });
    });
  });

  describe('get get message by id route', () => {
    beforeEach(() => {
      getByIdFunc = messageController.getMessageById as jest.Mock;
    });

    it('should return the message with 200 status code', async () => {
      const mockMessageId = new mongoose.Types.ObjectId().toHexString();

      const mockResponse = {
        ...sampleMessageValue,
        user: sampleMessageValue.user.toHexString(),
      };

      getByIdFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.success).json(mockResponse),
      );
      const response = await request(app)
        .get(`/messages/${mockMessageId}`)
        .expect(statusCodes.success);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 404 status code if message is not found', async () => {
      const mockMessageId = new mongoose.Types.ObjectId().toHexString();

      getByIdFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.notFound).json({ error: 'Message not found' }),
      );
      const response = await request(app)
        .get(`/messages/${mockMessageId}`)
        .expect(statusCodes.notFound);

      expect(response.body).toEqual({ error: 'Message not found' });
    });

    it('should return 500 status code if server error', async () => {
      const mockMessageId = new mongoose.Types.ObjectId().toHexString();

      getByIdFunc.mockImplementation(async (_req: Request, res: Response) =>
        res.status(statusCodes.queryError).json({ error: 'Server Error' }),
      );
      const response = await request(app)
        .get(`/messages/${mockMessageId}`)
        .expect(statusCodes.queryError);

      expect(response.body).toEqual({ error: 'Server Error' });
    });
  });
});
