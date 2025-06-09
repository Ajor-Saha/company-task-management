import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { addEmployee, analyzeEmployeePerformance, employeeLogin, getAllEmployees, getAvailableEmployeeToProject, getCompanyEmployees, getEmployeeStats, updateEmployee } from '../controllers/employee-controller';



const employee_router = Router();


employee_router.route('/add-new-employee').post(verifyJWT, addEmployee);
employee_router.route('/get-all-employee').get(verifyJWT, getAllEmployees);
employee_router.route('/employee-login').post(employeeLogin);
employee_router.route('/get-available-employee/:projectId').get(verifyJWT, getAvailableEmployeeToProject);
employee_router.route('/get-company-employee').get(verifyJWT, getCompanyEmployees);
employee_router.route('/get-employee-stats/:employeeId').get(verifyJWT, getEmployeeStats); // Assuming this is to get employee by ID
employee_router.route('/analyze-employee-performance').post(verifyJWT, analyzeEmployeePerformance);
employee_router.route('/update-employee/:employeeId').put(verifyJWT, updateEmployee);

export default employee_router;