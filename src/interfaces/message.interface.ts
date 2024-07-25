import { Types } from 'mongoose';

export interface IMessage {
  _id: Types.ObjectId;
  name: string;
  user?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
