import Message from '../models/messages.model';
import { Types } from 'mongoose';
import { IMessage } from '../interfaces/message.interface';
import { Request, Response } from 'express';

export const addMessage = async (
  req: Request & { session: { user: { _id: Types.ObjectId } } },
  res: Response,
): Promise<Response> => {
  const { message } = req.body as { message?: IMessage };

  if (!message || !message.name) {
    return res.status(400).json({ error: 'missing information' });
  }

  if (!req.session.user) {
    return res.status(500).json({ error: 'You are not authenticated' });
  }

  message.user = req.session.user._id;

  try {
    const messageObj = new Message(message);
    await messageObj.save();
    return res.status(200).json(messageObj);
  } catch (error) {
    // console.log('Error while adding message to DB', error.message);
    return res.status(500).json({ error: 'Failed to add message' });
  }
};
