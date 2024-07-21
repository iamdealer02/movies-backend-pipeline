import logger from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';
import Comment from '../models/comment.model';
import { Response, Request } from 'express';
import { HydratedDocument } from 'mongoose';
import { IComment } from '../interfaces/comment.interface';

const addComment = async (
  req: Request & {
    params: { movie_id?: string };
    body: {
      rating?: number;
      username?: string;
      comment?: string;
      title?: string;
    };
  },
  res: Response,
): Promise<Response> => {
  const { movie_id } = req.params;
  const { rating, username, comment, title } = req.body;

  const movieId: number = parseInt(movie_id);

  if (
    !movie_id ||
    isNaN(movieId) ||
    !rating ||
    !username ||
    !comment ||
    !title
  ) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'Missing parameters' });
  } else {
    try {
      const commentObj: HydratedDocument<IComment> = new Comment({
        movie_id: movieId,
        rating,
        username,
        comment,
        title,
      });

      await commentObj.save();

      return res.status(statusCodes.success).json({ message: 'Comment added' });
    } catch (error) {
      logger.error(error.stack);
      return res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while adding comment' });
    }
  }
};

const getCommentsById = async (
  req: Request & {
    params: { movie_id?: string };
  },
  res: Response,
): Promise<Response> => {
  const { movie_id } = req.params;
  const movieId: number = parseInt(movie_id);

  if (!movie_id || isNaN(movieId)) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'movie id missing' });
  } else {
    try {
      const comments: IComment[] = await Comment.find({ movie_id: movieId });
      return res.status(statusCodes.success).json(comments);
    } catch (error) {
      logger.error(error.stack);
      return res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while fetching comments' });
    }
  }
};

export { addComment, getCommentsById };
