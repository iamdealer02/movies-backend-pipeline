import { Schema, model } from 'mongoose';
import { IUser } from 'src/interfaces/user.interface';

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], // Define `messages` as an array of ObjectId references
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

export const User = model<IUser>('User', userSchema);
