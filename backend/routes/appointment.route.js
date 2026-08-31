import express from 'express';
import {
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
} from '../controllers/appointment.controller.js';
import { protectedRoute, authorizeRoles } from '../middlewares/protectedRoute.js';

const appointmentRoute = express.Router();

// Patient books an appointment
appointmentRoute.post('/', protectedRoute, authorizeRoles('patient'), bookAppointment);

// Both patient and doctor can view their appointments
appointmentRoute.get('/my', protectedRoute, getMyAppointments);

// Both patient and doctor can update status (ownership checked inside controller)
appointmentRoute.patch(
  '/:appointmentId/status',
  protectedRoute,
  authorizeRoles('patient', 'doctor'),
  updateAppointmentStatus
);

export default appointmentRoute;
