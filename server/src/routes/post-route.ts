import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { uploadFilesMiddleware } from '../middleware/upload-middleware';
import { createNewPost } from '../controllers/post-controllers';


const post_router = Router();



post_router.route('/create-new-post').post(verifyJWT, uploadFilesMiddleware, createNewPost);

export default post_router;  