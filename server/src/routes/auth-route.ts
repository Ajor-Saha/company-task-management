import { Router } from 'express'
import { login, logout, signup, updateProfilePicture, verifyEmail } from '../controllers/auth-controllers'
import { verifyJWT } from '../middleware/auth-middleware';
import { uploadMiddleware } from '../middleware/upload-middleware';


const user_router = Router();




user_router.route('/signup').post(signup);
user_router.route("/signin").post(login);
user_router.route("/signout").post(verifyJWT, logout);
user_router.route('/email-verification').post(verifyEmail);
user_router.route('/update-profile-picture').put(verifyJWT, uploadMiddleware, updateProfilePicture);

export default user_router; 