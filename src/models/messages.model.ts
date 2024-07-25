import { Schema, model } from 'mongoose';
import { IMessage } from 'src/interfaces/message.interface';

const messageSchema = new Schema<IMessage>(
    {
        name: {
            type: String,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: {
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
    },
)

const Message = model<IMessage>("Message", messageSchema);

export default Message;