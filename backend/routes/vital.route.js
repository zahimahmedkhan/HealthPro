import express from 'express'
const vitalRoute = express.Router();
import { authorizeRoles, protectedRoute } from '../middlewares/protectedRoute.js'
import checkPatientAccess from '../middlewares/checkPatientAccess.js';
import { addVital, deleteVital, getAllVitals, getPatientVitals, getSingleVital } from '../controllers/vital.controller.js';

vitalRoute.post("/", protectedRoute, addVital);

vitalRoute.get("/", protectedRoute, getAllVitals);

vitalRoute.get("/patient/:patientId", protectedRoute, authorizeRoles('doctor'), checkPatientAccess, getPatientVitals);

vitalRoute.get("/vitals/:id", protectedRoute, getSingleVital);

vitalRoute.delete("/:id", protectedRoute, deleteVital);

export default vitalRoute;