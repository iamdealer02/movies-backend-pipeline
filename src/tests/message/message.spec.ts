import mongoose from 'mongoose';
import Message from '../../models/messages.model';
import { Request, Response } from 'express';
import { IMessage } from '../../interfaces/message.interface';
import { getMockReq, getMockRes } from '@jest-mock/express';
import * as messageController from '../../controllers/messages.controller';
import logger from '../../middleware/winston';

jest.mock('../../middleware/winston', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  };
});

interface CustomSession {
  user: {
    _id: mongoose.Types.ObjectId;
    email?: string;
  };
}

type CustomRequest = Request & { session: CustomSession };

describe('testing message controller', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  describe('add message function', () => {
    const sampleMessageValue: {
      name: IMessage['name'];
      user: IMessage['user'];
    } = {
      name: 'mock name',
      user: new mongoose.Types.ObjectId(),
    };
    let req: CustomRequest;
    let res: Response;
    let saveStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        body: {
          message: {
            name: sampleMessageValue.name,
            user: sampleMessageValue.user,
          },
        },
        session: {
          user: {
            _id: sampleMessageValue.user,
          },
        },
      });
      res = getMockRes().res;
      saveStub = jest.spyOn(Message.prototype, 'save');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 if message or message.name is missing', async () => {
      req.body = {};
      await messageController.addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 500 if user is not authenticated', async () => {
      req.session.user = null;
      await messageController.addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not authenticated',
      });
    });

    it('should return 201 and save the message successfully', async () => {
      const mockMessage = new Message({
        ...sampleMessageValue,
        user: req.session.user._id,
      });

      saveStub.mockResolvedValue(mockMessage);

      await messageController.addMessage(req, res);

      expect(saveStub).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      // expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 500 if there is an error while saving the message', async () => {
      saveStub.mockRejectedValue(new Error('Save failed'));

      await messageController.addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to add message' });
    });
  });

  describe('edit message function', () => {
    const sampleMessageValue: {
      name: IMessage['name'];
      user: IMessage['user'];
    } = {
      name: 'mock name',
      user: new mongoose.Types.ObjectId(),
    };
    let req: CustomRequest;
    let res: Response;
    let findByIdAndUpdateStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        body: {
          name: sampleMessageValue.name,
        },
        params: {
          messageId: new mongoose.Types.ObjectId().toHexString(),
        },
      });
      res = getMockRes().res;
      findByIdAndUpdateStub = jest.spyOn(Message, 'findByIdAndUpdate');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 if name or messageId is missing', async () => {
      req.body = {};
      await messageController.editMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 404 if message is not found', async () => {
      findByIdAndUpdateStub.mockResolvedValue(null);

      await messageController.editMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should return 200 and update the message successfully', async () => {
      const mockMessage = new Message({
        ...sampleMessageValue,
        _id: req.params.messageId,
      });

      findByIdAndUpdateStub.mockResolvedValue(mockMessage);

      await messageController.editMessage(req, res);

      expect(findByIdAndUpdateStub).toHaveBeenCalledWith(
        req.params.messageId,
        { name: req.body.name },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 500 if there is an error while updating the message', async () => {
      findByIdAndUpdateStub.mockRejectedValue(new Error('Update failed'));

      await messageController.editMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to edit message',
      });
    });
  });

  describe('get messages function', () => {
    let req: Request;
    let res: Response;
    let findStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq();
      res = getMockRes().res;
      findStub = jest.spyOn(Message, 'find');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 200 and fetch messages successfully', async () => {
      const mockMessages = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'mock name',
          user: new mongoose.Types.ObjectId(),
        },
      ];

      const populateMock = {
        populate: jest.fn().mockResolvedValue(mockMessages),
      };

      findStub.mockReturnValue(populateMock);

      await messageController.getMessages(req, res);

      expect(findStub).toHaveBeenCalled();
      expect(populateMock.populate).toHaveBeenCalledWith('user');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessages);
    });

    it('should return 500 if there is an error', async () => {
      const errorMessage = 'Failed to fetch messages';
      const populateMock = {
        populate: jest.fn().mockRejectedValue(new Error(errorMessage)),
      };

      findStub.mockReturnValue(populateMock);

      await messageController.getMessages(req, res);

      expect(findStub).toHaveBeenCalled();
      expect(populateMock.populate).toHaveBeenCalledWith('user');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch messages',
      });
    });
  });

  describe('delete message function', () => {
    let req: CustomRequest;
    let res: Response;
    let findByIdAndDeleteStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq<CustomRequest>({
        params: {
          messageId: new mongoose.Types.ObjectId().toHexString(),
        },
      });
      res = getMockRes().res;
      findByIdAndDeleteStub = jest.spyOn(Message, 'findByIdAndDelete');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 if messageId is missing', async () => {
      req.params = {};
      await messageController.deleteMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 200 and delete the message successfully', async () => {
      const mockMessage = { message: 'message deleted' };
      findByIdAndDeleteStub.mockResolvedValue(mockMessage);

      await messageController.deleteMessage(req, res);

      expect(findByIdAndDeleteStub).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 500 if there is an error while deleting the message', async () => {
      findByIdAndDeleteStub.mockRejectedValue(new Error('Delete failed'));

      await messageController.deleteMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete message',
      });
    });
  });

  describe('get message by id function', () => {
    let req: Request;
    let res: Response;
    let findByIdStub: jest.SpyInstance;

    beforeEach(() => {
      req = getMockReq<Request>({
        params: {
          messageId: new mongoose.Types.ObjectId().toHexString(),
        },
      });
      res = getMockRes().res;
      findByIdStub = jest.spyOn(Message, 'findById');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 400 if message id is missing', async () => {
      req.params = {};
      await messageController.getMessageById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 404 if message is not found', async () => {
      findByIdStub.mockResolvedValue(null);

      await messageController.getMessageById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should return 200 and the message if found', async () => {
      const mockMessage = {
        _id: req.params.messageId,
        name: 'mock name',
        user: new mongoose.Types.ObjectId(),
      };

      findByIdStub.mockResolvedValue(mockMessage);

      await messageController.getMessageById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it('should return 500 if there is an error while fetching the message', async () => {
      findByIdStub.mockRejectedValue(new Error('Find failed'));

      await messageController.getMessageById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch message',
      });
    });
  });
});
