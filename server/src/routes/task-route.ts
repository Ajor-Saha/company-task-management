import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { createPersonalTask, createTask, deleteTask, getAssignedMeTasks, getRecentTasks, getTasksByProjectId, updateTask } from '../controllers/task-controllers';

const task_router = Router();


task_router.route('/create-new-task').post(verifyJWT, createTask);
task_router.route('/get-project-tasks/:projectId').get(verifyJWT, getTasksByProjectId);
task_router.route('/update-task/:taskId').put(verifyJWT, updateTask);
task_router.route('/delete-task/:taskId').delete(verifyJWT, deleteTask);
task_router.route('/create-personal-task').post(verifyJWT, createPersonalTask);
task_router.route('/get-recent-tasks').get(verifyJWT, getRecentTasks);
task_router.route('/get-assigned-tasks').get(verifyJWT, getAssignedMeTasks);

export default task_router; 