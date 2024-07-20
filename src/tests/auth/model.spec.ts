import chai from 'chai';
const expect = chai.expect;
import mongoose from 'mongoose';
import { User } from '../../models/users.model';
import { IUser } from '../../interfaces/user.interface';

const ValidationErrors = mongoose.Error.ValidationError;

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
    messages: [],
  };
  // it should throw a validation error for missing fields
  it('should throw a validation error for missing fields', (done) => {
    const user = new User();
    const err = user.validateSync();
    if (err) {
      expect(err).to.be.instanceOf(ValidationErrors);
      expect(err.errors.email).to.exist;
      expect(err.errors.password).to.exist;
      done();
    } else {
      const unexpectedError = new Error('Unexpected success');
      done(unexpectedError);
    }
  });

  // it should create users successfully with all required fields
  it('should create users successfully with all required fields', (done) => {
    const user = new User(sampleUserValue);
    const err = user.validateSync();
    if (err) {
      const unexpectedError = new Error('Validation failed');
      done(unexpectedError);
    } else {
      expect(user).to.exist;
      expect(user).to.have.property('email').to.equal(sampleUserValue.email);
      expect(user)
        .to.have.property('password')
        .to.equal(sampleUserValue.password);
      done();
    }
  });
});
