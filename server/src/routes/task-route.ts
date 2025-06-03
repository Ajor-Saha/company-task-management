import { Router } from 'express'
import { verifyJWT } from '../middleware/auth-middleware';
import { uploadFilesMiddleware } from '../middleware/upload-middleware';
import { createPersonalTask, createTask, deleteTask, deleteTaskFile, getAssignedMeTasks, getEmployeeTaskStats, getRecentTasks, getTasksByProjectId, updateTask, uploadTaskFiles } from '../controllers/task-controllers';

const task_router = Router();


task_router.route('/create-new-task').post(verifyJWT, createTask);
task_router.route('/get-project-tasks/:projectId').get(verifyJWT, getTasksByProjectId);
task_router.route('/update-task/:taskId').put(verifyJWT, updateTask);
task_router.route('/delete-task/:taskId').delete(verifyJWT, deleteTask);
task_router.route('/create-personal-task').post(verifyJWT, createPersonalTask);
task_router.route('/get-recent-tasks').get(verifyJWT, getRecentTasks);
task_router.route('/get-assigned-tasks').get(verifyJWT, getAssignedMeTasks);
task_router.route('/employee-tasks-stats').get(verifyJWT, getEmployeeTaskStats);
task_router.route('/upload-task-files/:taskId').post(verifyJWT, uploadFilesMiddleware, uploadTaskFiles);
task_router.route('/delete-task-file').delete(verifyJWT, deleteTaskFile);

export default task_router; 