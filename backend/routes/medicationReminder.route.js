import express from 'express';
import {
  addReminder,
  getMyReminders,
  updateReminder,
  deleteReminder,
} from '../controllers/medicationReminder.controller.js';
import { protectedRoute, authorizeRoles } from '../middlewares/protectedRoute.js';

const medicationReminderRoute = express.Router();

// All routes are patient-only
medicationReminderRoute.use(protectedRoute, authorizeRoles('patient'));

// CRUD routes
medicationReminderRoute.post('/', addReminder);
medicationReminderRoute.get('/', getMyReminders);
medicationReminderRoute.patch('/:id', updateReminder);
medicationReminderRoute.delete('/:id', deleteReminder);

export default medicationReminderRoute;
