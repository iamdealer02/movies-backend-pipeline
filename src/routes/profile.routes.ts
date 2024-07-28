import express from 'express';
import * as profileController from '../controllers/profile.controller';

const router = express.Router();

router.put('/', profileController.editPassword);
router.post('/', profileController.logout);

export default router;
