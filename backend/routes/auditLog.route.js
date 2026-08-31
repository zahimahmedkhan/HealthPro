import express from 'express';
import { getMyAccessHistory, getAllAuditLogs } from '../controllers/auditLog.controller.js';
import { protectedRoute, authorizeRoles } from '../middlewares/protectedRoute.js';

const auditLogRoute = express.Router();

// Patient views their own access history
auditLogRoute.get('/my-history', protectedRoute, authorizeRoles('patient'), getMyAccessHistory);

// Admin views all audit logs
auditLogRoute.get('/all', protectedRoute, authorizeRoles('admin'), getAllAuditLogs);

export default auditLogRoute;
