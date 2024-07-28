import express from 'express';
import * as messageController from '../controllers/messages.controller';

const router = express.Router();

router.post('/add/message', messageController.addMessage);
router.get('/:messageId', messageController.getMessageById);
router.delete('/delete/:messageId', messageController.deleteMessage);
router.put('/edit/:messageId', messageController.editMessage);
router.get('/', messageController.getMessages);

export default router;
