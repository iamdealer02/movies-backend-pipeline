import express from 'express';
import * as profileController from '../controllers/profile.controller';

const router = express.Router();

router.put('/editPassword', profileController.editPassword);
router.post('/logout', profileController.logout);

export default router;
