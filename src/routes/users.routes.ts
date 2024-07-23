import express from 'express';
import * as userService from '../controllers/users.controller';

const router = express.Router();

router.post('/register', userService.registerUser);

export default router;
