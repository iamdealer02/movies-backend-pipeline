import logger from '../../middleware/winston';
import * as commentController from '../../controllers/comment.controller';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { Request, Response } from 'express';
import { sampleComment, sampleComments } from './test.data';
import Comment from '../../models/comment.model';

// To avoid log statements in the console during tests and to close logger stream (openHandle error)
jest.mock('../../middleware/winston', () => ({
  error: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
}));

describe('Testing comment controller', () => {
  const sampleMovieId = '12345';

  beforeEach(() => {
    jest.spyOn(logger, 'error').mockReturnValue(null);
    jest.spyOn(logger, 'info').mockReturnValue(null);
    jest.spyOn(logger, 'http').mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Testing addComment service', () => {
    let req: Request;
    const res: Response = getMockRes().res;

    // Error tests
    it('should return an error message when movie id is not passed', async () => {
      req = getMockReq({
        params: {},
        body: { rating: 5, username: 'test', comment: 'test', title: 'test' },
      });

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing parameters',
      });
    });

    it('should return an error message when movie id is not a number', async () => {
      req = getMockReq({
        params: { movie_id: 'nan' },
        body: { rating: 5, username: 'test', comment: 'test', title: 'test' },
      });

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing parameters',
      });
    });

    it('should return an error message when required body arguments is not passed', async () => {
      req = getMockReq({ params: { movie_id: sampleMovieId }, body: {} });

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing parameters',
      });
    });

    it('should return an error for a query error', async () => {
      req = getMockReq({
        params: { movie_id: sampleMovieId },
        body: { rating: 5, username: 'test', title: 'test', comment: 'test' },
      });
      const savingError = new Error('Saving Error');
      jest.spyOn(Comment.prototype, 'save').mockImplementation(async () => {
        throw savingError;
      });

      await commentController.addComment(req, res);

      expect(logger.error).toHaveBeenCalledWith(savingError.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding comment',
      });
    });

    it('should create a comment successfully', async () => {
      req = getMockReq({
        params: { movie_id: sampleMovieId },
        body: { rating: 5, username: 'test', title: 'test', comment: 'test' },
      });
      jest.spyOn(Comment.prototype, 'save').mockResolvedValue(sampleComment);

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comment added',
      });
    });
  });

  describe('Testing getCommentsById service', () => {
    let req: Request;
    const res: Response = getMockRes().res;

    // Error tests
    it('should return an error message when movie id is not passed', async () => {
      req = getMockReq({
        params: {},
        body: { rating: 5, username: 'test', comment: 'test', title: 'test' },
      });

      await commentController.getCommentsById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'movie id missing',
      });
    });

    it('should return an error message when movie id is not a number', async () => {
      req = getMockReq({
        params: { movie_id: 'nan' },
        body: { rating: 5, username: 'test', comment: 'test', title: 'test' },
      });

      await commentController.getCommentsById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'movie id missing',
      });
    });

    it('should return an error for a query error', async () => {
      req = getMockReq({
        params: { movie_id: sampleMovieId },
        body: { rating: 5, username: 'test', title: 'test', comment: 'test' },
      });
      const findError = new Error('Find Error');
      jest.spyOn(Comment, 'find').mockRejectedValue(findError);

      await commentController.getCommentsById(req, res);

      expect(logger.error).toHaveBeenCalledWith(findError.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Exception occurred while fetching comments',
      });
    });

    // Success tests
    it('should get comments of a given movie_id successfully', async () => {
      req = getMockReq({
        params: { movie_id: sampleMovieId },
        body: { rating: 5, username: 'test', title: 'test', comment: 'test' },
      });
      const commentFindMock = jest
        .spyOn(Comment, 'find')
        .mockResolvedValue(sampleComments);

      await commentController.getCommentsById(req, res);

      expect(commentFindMock).toHaveBeenCalledWith({ movie_id: 12345 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(sampleComments);
    });
  });
});
