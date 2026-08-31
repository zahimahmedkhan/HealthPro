import express from 'express';
import {
  upsertEmergencyProfile,
  getMyEmergencyProfile,
  getPublicEmergencyProfile,
} from '../controllers/emergencyProfile.controller.js';
import { protectedRoute, authorizeRoles } from '../middlewares/protectedRoute.js';

const emergencyProfileRoute = express.Router();

// Patient creates/updates their emergency profile
emergencyProfileRoute.put('/', protectedRoute, authorizeRoles('patient'), upsertEmergencyProfile);

// Patient fetches their own emergency profile
emergencyProfileRoute.get('/me', protectedRoute, authorizeRoles('patient'), getMyEmergencyProfile);

// Public endpoint — no authentication required
emergencyProfileRoute.get('/public/:userId', getPublicEmergencyProfile);

export default emergencyProfileRoute;
