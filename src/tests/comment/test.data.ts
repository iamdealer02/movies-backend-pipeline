import { IComment } from '../../interfaces/comment.interface';

const sampleComment: IComment = {
  movie_id: 1,
  username: 'test',
  comment: 'test',
  title: 'test',
  rating: 5,
  downvotes: 0,
  upvotes: 0,
};

const sampleComments: IComment[] = [
  {
    movie_id: 12345,
    username: 'test',
    comment: 'test',
    title: 'test',
    rating: 5,
    downvotes: 0,
    upvotes: 0,
  },
  {
    movie_id: 12345,
    username: 'test',
    comment: 'test',
    title: 'test',
    rating: 5,
    downvotes: 0,
    upvotes: 0,
  },
];

export { sampleComment, sampleComments };
