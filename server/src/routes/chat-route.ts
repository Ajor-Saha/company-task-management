import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { getProjectMessages } from '../controllers/chat-controllers';

const chat_router = Router();


chat_router.route('/get-project-message/:projectId').get(verifyJWT, getProjectMessages);


export default chat_router; 