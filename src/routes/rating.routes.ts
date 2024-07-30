import express from 'express';
import { addRating } from '../controllers/rating.controller';

const router = express.Router();

router.post('/movies/:movieId/rating', addRating);

export default router;
