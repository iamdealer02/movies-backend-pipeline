import express from 'express';
import * as messageController from '../controllers/messages.controller';

const router = express.Router();

router.post('/add/message', messageController.addMessage);
router.delete('/delete/:messageId', messageController.deleteMessage);

export default router;
