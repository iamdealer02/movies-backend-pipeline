import mongoose from 'mongoose';
import { IMessage } from 'src/interfaces/message.interface';
import { SuperTest, Test } from 'supertest';

export type SuperTestAgent = SuperTest<Test> & {
  post: (url: string) => Test;
  get: (url: string) => Test;
  put: (url: string) => Test;
  delete: (url: string) => Test;
  set: (header: string, value: string) => SuperTestAgent;
  send: (body: object) => Test;
};

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
