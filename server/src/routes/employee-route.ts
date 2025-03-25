import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { addEmployee } from '../controllers/employee-controller';



const employee_router = Router();


employee_router.route('/add-new-employee').post(verifyJWT, addEmployee);



export default employee_router;