import { analyzeFile, deleteInsight, getAllInsights, getInsightById, getPatientInsights } from '../controllers/ai.controller.js';
import { authorizeRoles, protectedRoute } from '../middlewares/protectedRoute.js';
import checkPatientAccess from '../middlewares/checkPatientAccess.js';
import express from 'express'

const aiRoute = express.Router();
aiRoute.post("/analyze", protectedRoute, analyzeFile);

aiRoute.get("/insights", protectedRoute, getAllInsights);

aiRoute.get("/insights/patient/:patientId", protectedRoute, authorizeRoles('doctor'), checkPatientAccess, getPatientInsights);

aiRoute.get("/insights/:id", protectedRoute, getInsightById);

aiRoute.delete("/insights/:id", protectedRoute, deleteInsight);

export default aiRoute