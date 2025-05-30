import { Router } from 'express'
import { assignEmployeeToProject, createProject, deleteProject, getCompanyProjects, getProjectDetails, getProjectStats, removeEmployeeFromProject, updateProject, updateProjectDescription, updateProjectStatus } from '../controllers/project-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const project_router = Router();


project_router.route('/add-new-project').post(verifyJWT, createProject);
project_router.route('/get-admin-projects').get(verifyJWT, getCompanyProjects);
project_router.route('/get-project-details/:projectId').get(verifyJWT, getProjectDetails);
project_router.route('/update-project/:projectId').put(verifyJWT, updateProject);
project_router.route('/delete-project/:projectId').delete(verifyJWT, deleteProject);
project_router.route('/assign-employee-project').post(verifyJWT, assignEmployeeToProject);
project_router.route('/update-project-status/:projectId').patch(verifyJWT, updateProjectStatus);
project_router.route('/remove-employee-project').delete(verifyJWT, removeEmployeeFromProject); // Assuming the same controller is used for removing an employee
project_router.route('/update-project-description/:projectId').put(verifyJWT, updateProjectDescription); // Assuming the same controller is used for updating the project description
project_router.route('/get-project-stats/:projectId').get(verifyJWT, getProjectStats); // Assuming the same controller is used for getting project stats

export default project_router; 