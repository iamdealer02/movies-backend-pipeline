import mongoose from 'mongoose';
import { IMessage } from 'src/interfaces/message.interface';

export const testData: IMessage = {
  _id: new mongoose.Types.ObjectId(),
  name: 'mock messsage name',
  user: new mongoose.Types.ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const user = {
  email: 'test@gmail.com',
  username: 'testuser',
  password: 'testpassword',
} as {
  email: string;
  username: string;
  password: string;
};
