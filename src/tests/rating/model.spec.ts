import mongoose from 'mongoose';
import { Rating } from '../../models/rating.model';
import { IRating } from '../../interfaces/rating.interface'; 

describe('Rating Model Test', () => {
  const sampleRatingValue: {
    movie_id: IRating['movie_id'];
    email: IRating['email'];
    rating: IRating['rating'];
    created_at: IRating['created_at']; 
  } = {
    movie_id: 1,
    email: 'test@example.com',
    rating: 4,
    created_at: new Date(),
  };


  it('should throw a validation error for missing movie_id', () => {
    const rating = new Rating({
      email: 'test@example.com',
      rating: 4,
    });
    const err = rating.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('movie_id');
  });

  it('should throw a validation error for missing email', () => {
    const rating = new Rating({
      movie_id: 1,
      rating: 4,
    });
    const err = rating.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('email');
  });


  it('should throw a validation error for rating out of range', () => {
    const rating = new Rating({
      movie_id: 1,
      email: 'test@example.com',
      rating: 10, // Invalid rating
    });
    const err = rating.validateSync();
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err?.errors).toHaveProperty('rating');
  });


  it('should create ratings successfully with all required fields', () => {
    const rating = new Rating(sampleRatingValue);
    const err = rating.validateSync();
    expect(err).toBeUndefined();
    expect(rating).toHaveProperty('movie_id', sampleRatingValue.movie_id);
    expect(rating).toHaveProperty('email', sampleRatingValue.email);
    expect(rating).toHaveProperty('rating', sampleRatingValue.rating);
  });


  it('created_at should be a Date instance', () => {
    const rating = new Rating(sampleRatingValue);
    expect(rating).toHaveProperty('created_at');
    expect(rating.created_at).toBeInstanceOf(Date);
  });
});
