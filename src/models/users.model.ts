import { Schema, model } from 'mongoose';
import { IUser } from 'src/interfaces/user.interface';

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
});

export const User = model<IUser>('User', userSchema);
