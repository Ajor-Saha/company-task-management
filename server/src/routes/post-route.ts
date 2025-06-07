import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { uploadFilesMiddleware } from '../middleware/upload-middleware';
import { createNewPost, deletePost, editPost } from '../controllers/post-controllers';


const post_router = Router();



post_router.route('/create-new-post').post(verifyJWT, uploadFilesMiddleware, createNewPost);
post_router.route('/edit-post/:postId').put(verifyJWT, uploadFilesMiddleware, editPost);
post_router.route('/delete-post/:postId').delete(verifyJWT, deletePost);
