import express from 'express';
import { uploadReportForPatient } from '../controllers/labReport.controller.js';
import { authorizeRoles, protectedRoute } from '../middlewares/protectedRoute.js';
import checkPatientAccess from '../middlewares/checkPatientAccess.js';

const labReportRoute = express.Router();

labReportRoute.post(
    '/upload/:patientId',
    protectedRoute,
    authorizeRoles('lab'),
    checkPatientAccess,
    uploadReportForPatient,
);

export default labReportRoute;
