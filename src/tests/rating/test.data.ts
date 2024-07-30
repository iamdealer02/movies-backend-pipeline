export const mockUser = {
  email: 'test@example.com',
};

export const mockRequestData = {
  validRating: { rating: 4 },
  missingRating: {},
  invalidRating: { rating: 'notANum' },
};

export const mockResponses = {
  missingParameters: { message: 'Missing parameters' },
  ratingAdded: { message: 'Rating added' },
  queryError: { error: 'Exception occurred while adding rating' },
};

export const mockRatings: { rating: number }[] = [{ rating: 4 }];

export const sampleRating = {
  movie_id: 111,
  rating: 5,
};

export const invalidRating = {
  movie_id: 'notANumber',
  rating: 'notANumber', // Invalid rating
};
