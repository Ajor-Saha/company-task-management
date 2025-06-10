import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { deleteBotMessage, getUserBotMessages, saveBotMessages } from '../controllers/aibot-controllers';


const bot_router = Router();


bot_router.route('/save-bot-messages').post(verifyJWT, saveBotMessages);
bot_router.route('/get-bot-messages').get(verifyJWT, getUserBotMessages);
bot_router.route('/delete-bot-message').delete(verifyJWT, deleteBotMessage);

export default bot_router; 