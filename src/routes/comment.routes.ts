import express from 'express';
import * as commentController from '../controllers/comment.controller';

const router = express.Router();

router.post('/:movie_id', commentController.addComment);

export default router;
