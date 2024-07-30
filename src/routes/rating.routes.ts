import express from 'express';
import { addRating } from '../controllers/rating.controller';

const router = express.Router();

router.post('/:movieId', addRating);

export default router;
