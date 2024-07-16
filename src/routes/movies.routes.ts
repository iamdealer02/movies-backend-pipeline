import express from 'express';
import * as moviesController from '../controllers/movies.controller';

const router = express.Router();

router.get('/', moviesController.getMovies);

export default router;
