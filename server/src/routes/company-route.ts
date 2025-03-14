import { Router } from 'express'
import { createCompany } from '../controllers/company-controllers';



const company_router = Router();


company_router.route('/add-new-company').post(createCompany);



export default company_router; 