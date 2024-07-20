import express, { Router } from 'express';
import * as moviesController from '../controllers/movies.controller';

const router: Router = express.Router();

router.get('/', moviesController.getMovies);
router.get('/top', moviesController.getTopRatedMovies);
router.get('/me', moviesController.getSeenMovies);

export default router;
