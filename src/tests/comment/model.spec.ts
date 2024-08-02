import mongoose, { HydratedDocument } from 'mongoose';
import Comment from '../../models/comment.model';
import { IComment } from '../../interfaces/comment.interface';
import { sampleComment } from './test.data';

const ValidationErrors = mongoose.Error.ValidationError;

describe('User Model test', () => {
  it('should throw a validation error for missing fields', (done) => {
    const comment: HydratedDocument<IComment> = new Comment();
    const err = comment.validateSync();
    if (err) {
      expect(err).toBeInstanceOf(ValidationErrors);
      expect(err.errors.movie_id).toBeDefined();
      expect(err.errors.username).toBeDefined();
      expect(err.errors.rating).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.comment).toBeDefined();
      done();
    } else {
      const unexpectedError = new Error('Unexpected success');
      done(unexpectedError);
    }
  });

  it('should create comment successfully with all required fields', (done) => {
    const comment: HydratedDocument<IComment> = new Comment(sampleComment);
    const err = comment.validateSync();
    if (err) {
      const unexpectedError = new Error(
        'Unexpected success with empty comment',
      );
      done(unexpectedError);
    } else {
      expect(comment).toBeDefined();
      expect(comment).toBeInstanceOf(Comment);
      expect(comment).toHaveProperty('movie_id', sampleComment.movie_id);
      expect(comment).toHaveProperty('username', sampleComment.username);
      expect(comment).toHaveProperty('comment', sampleComment.comment);
      expect(comment).toHaveProperty('title', sampleComment.title);
      expect(comment).toHaveProperty('rating', sampleComment.rating);
      expect(comment).toHaveProperty('downvotes', sampleComment.downvotes);
      expect(comment).toHaveProperty('upvotes', sampleComment.upvotes);
      done();
    }
  });
});
