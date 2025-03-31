import { Router } from 'express'
import { createCompany, getCompanyDetails, updateCompanyDetails } from '../controllers/company-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const company_router = Router();

// Public route
company_router.route('/add-new-company').post(createCompany);

// Protected routes requiring authentication
company_router.route('/get-company-details').get(verifyJWT, getCompanyDetails); // Get company details for the authenticated user
company_router.route('/update-company-details').put(verifyJWT, updateCompanyDetails); // Update company details

export default company_router; 