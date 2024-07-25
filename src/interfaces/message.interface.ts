import { Types } from 'mongoose';

export interface IMessage {
  name: string;
  user?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
