import { Router } from 'express'
import { assignEmployeeToProject, createProject, deleteProject, getCompanyProjects, getProjectDetails, updateProject } from '../controllers/project-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const project_router = Router();


project_router.route('/add-new-project').post(verifyJWT, createProject);
project_router.route('/get-admin-projects').get(verifyJWT, getCompanyProjects);
project_router.route('/get-project-details/:projectId').get(verifyJWT, getProjectDetails);
project_router.route('/update-project/:projectId').put(verifyJWT, updateProject);
project_router.route('/delete-project/:projectId').delete(verifyJWT, deleteProject);
project_router.route('/assign-employee-project').post(verifyJWT, assignEmployeeToProject);

export default project_router; 