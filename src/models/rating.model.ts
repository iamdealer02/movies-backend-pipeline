import { Schema, model } from 'mongoose';
import { IRating } from 'src/interfaces/rating.interface';


const ratingSchema = new Schema<IRating>(
  {
    movie_id: {
      type: Number,
      required: [true, 'movie is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: [true, 'rating is required'],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
    },
  }
);

const Rating = model<IRating>('Rating', ratingSchema);
export {Rating};
