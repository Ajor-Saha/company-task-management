import { Router } from 'express'
import { createCompany, getCompanyDetails, getCompanyProjectsAndEmployees, getDashboardMetrics, getMonthlySalesData, getProjectTaskStats, getRecentEmployees, updateCompanyDetails } from '../controllers/company-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const company_router = Router();

// Public route
company_router.route('/add-new-company').post(createCompany);

// Protected routes requiring authentication
company_router.route('/get-company-details').get(verifyJWT, getCompanyDetails); // Get company details for the authenticated user
company_router.route('/update-company-details').put(verifyJWT, updateCompanyDetails); // Update company details
company_router.route('/get-dashboard-metrics').get(verifyJWT, getDashboardMetrics); // Get dashboard metrics
company_router.route('/get-recent-employees').get(verifyJWT, getRecentEmployees); // Get recent employees
company_router.route('/get-monthly-sales-data').get(verifyJWT, getMonthlySalesData); // Get monthly sales data
company_router.route('/get-project-stats/:projectId').get(verifyJWT, getProjectTaskStats); // Get project stats
company_router.route('/get-projects-and-employees').get(verifyJWT, getCompanyProjectsAndEmployees); // Get projects and employees

export default company_router; 