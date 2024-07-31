export interface IComment {
  movie_id: number;
  username: string;
  comment: string;
  title: string;
  rating: number;
  downvotes?: number;
  upvotes?: number;
}
