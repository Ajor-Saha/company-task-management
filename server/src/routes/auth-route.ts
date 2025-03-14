import { Router } from 'express'
import { login, logout, signup, verifyEmail } from '../controllers/auth-controllers'
import { verifyJWT } from '../middleware/auth-middleware';


const user_router = Router();


user_router.route('/signup').post(signup);
user_router.route("/signin").post(login);
user_router.route("/signout").post(verifyJWT, logout);
user_router.route('/email-verification').post(verifyEmail);


export default user_router; 