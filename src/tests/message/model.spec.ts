import mongoose from 'mongoose';
import { testData } from "./test.data";
import { IMessage } from "../../interfaces/message.interface";
import Message from '../../models/messages.model';

describe('Message Model test', () => {
  const sampleMessageValue: {
      name: IMessage['name'];
      user?: IMessage['user'];
      createdAt: IMessage['createdAt'];
      updatedAt: IMessage['updatedAt'];
  } = testData

  // it should throw a validation error for missing fields
  it('should throw a validation error for missing name', () => {
    const message = new Message({ user: new mongoose.Types.ObjectId() });
    const err = message.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('name');
  });

  it('should throw a validation error for missing user', () => {
    const message = new Message({ name: 'mock message name'});
    const err = message.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('user');
  })

  it('should add a message successfully with all required fields', () => {
    const message = new Message(sampleMessageValue)
    const err = message.validateSync();
    expect(err).toBeUndefined();
    expect(message).toHaveProperty('name', sampleMessageValue.name);
    expect(message).toHaveProperty('user', sampleMessageValue.user);
  })
});
