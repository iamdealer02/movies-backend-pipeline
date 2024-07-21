import express from 'express';
import * as commentController from '../controllers/comment.controller';

const router = express.Router();

router.post('/:movie_id', commentController.addComment);
router.get('/:movie_id', commentController.getCommentsById);

export default router;
