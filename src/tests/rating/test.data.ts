export const mockUser = {
    email: 'test@example.com'
  };
  
  export const mockRequestData = {
    validRating: { rating: 4 },
    missingRating: {}
  };
  
  export const mockResponses = {
    missingParameters: { message: 'Missing parameters' },
    ratingAdded: { message: 'Rating added' },
    queryError: { error: 'Exception occurred while adding rating' }
  };
  
  export const mockRatings: { rating: number }[] = [{ rating: 4 }];
