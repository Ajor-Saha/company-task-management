import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { addEmployee, employeeLogin, getAllEmployees, getAvailableEmployeeToProject } from '../controllers/employee-controller';



const employee_router = Router();


employee_router.route('/add-new-employee').post(verifyJWT, addEmployee);
employee_router.route('/get-all-employee').get(verifyJWT, getAllEmployees);
employee_router.route('/employee-login').post(employeeLogin);
employee_router.route('/get-available-employee/:projectId').get(verifyJWT, getAvailableEmployeeToProject);

export default employee_router;