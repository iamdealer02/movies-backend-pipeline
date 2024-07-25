import { Schema, model } from 'mongoose';
import { IMessage } from '../interfaces/message.interface';

const messageSchema = new Schema<IMessage>(
  {
    name: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

const Message = model<IMessage>('Message', messageSchema);

export default Message;
