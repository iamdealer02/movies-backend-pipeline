import express from 'express';
import * as authController from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', authController.signIn);
router.post('/signup', authController.signUp);
router.get('/me', authController.getUser);
export default router;
