import mongoose from 'mongoose';
import { User } from '../../models/users.model';
import { IUser } from '../../interfaces/user.interface';

describe('User Model test', () => {
  const sampleUserValue: {
    username: IUser['username'];
    email: IUser['email'];
    password: IUser['password'];
    createdAt: IUser['createdAt'];
    updatedAt: IUser['updatedAt'];
    messages: IUser['messages'];
  } = {
    username: 'test',
    email: 'test@gmail.com',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [new mongoose.Types.ObjectId()],
  };

  // it should throw a validation error for missing fields
  it('should throw a validation error for missing email', () => {
    const user = new User({ password: 'password' });
    const err = user.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('email');
  });

  it('should throw a validation error for missing password', () => {
    const user = new User({ email: 'test@gmail.com' });
    const err = user.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('password');
  });

  // it should create users successfully with all required fields
  it('should create users successfully with all required fields', () => {
    const user = new User(sampleUserValue);
    const err = user.validateSync();
    expect(err).toBeUndefined();
    expect(user).toHaveProperty('email', sampleUserValue.email);
    expect(user).toHaveProperty('password', sampleUserValue.password);
  });

  // messages should be an array of ObjectIds
  it('messages should be an array of ObjectIds', () => {
    const user = new User(sampleUserValue);
    expect(user).toHaveProperty('messages');
    expect(user.messages).toHaveLength(1);
    expect(user.messages[0]).toBeInstanceOf(mongoose.Types.ObjectId);
  });
});
