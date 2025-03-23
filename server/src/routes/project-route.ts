import { Router } from 'express'
import { createProject, deleteProject, getCompanyProjects, updateProject } from '../controllers/project-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const project_router = Router();


project_router.route('/add-new-project').post(verifyJWT, createProject);
project_router.route('/get-admin-projects').get(verifyJWT, getCompanyProjects);
project_router.route('/update-project/:projectId').put(verifyJWT, updateProject);
project_router.route('/delete-project/:projectId').delete(verifyJWT, deleteProject);

export default project_router; 