import { Types } from 'mongoose';

export interface IUser {
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  messages: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
