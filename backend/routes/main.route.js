import express from 'express'
import userRoute, { adminRoute } from './user.route.js';
import aiRoute from './ai.route.js';
import vitalRoute from './vital.route.js';
import accessRoute from './access.route.js';
import emergencyProfileRoute from './emergencyProfile.route.js';
import appointmentRoute from './appointment.route.js';
import medicationReminderRoute from './medicationReminder.route.js';
import auditLogRoute from './auditLog.route.js';
import labReportRoute from './labReport.route.js';

const mainRoute = express.Router();

// Info route - shows available routes
mainRoute.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Healthcare API - Available Routes',
    routes: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/user-profile (protected)',
        'PUT /api/auth/update-profile (protected)'
      ],
      admin: [
        'GET /api/admin/pending-verifications (admin only)',
        'PATCH /api/admin/approve-verification/:userId (admin only)'
      ],
      access: [
        'GET /api/access/search-patient (doctor/lab)',
        'POST /api/access/request (doctor/lab)',
        'PATCH /api/access/respond (patient only)',
        'GET /api/access/my-grants (patient only)',
        'GET /api/access/my-patients (doctor/lab)',
        'PATCH /api/access/revoke/:grantId (patient only)'
      ],
      vitals: [
        'POST /api/vitals (protected)',
        'GET /api/vitals (protected)',
        'GET /api/vitals/patient/:patientId (doctor only + approved access)',
        'GET /api/vitals/:id (protected)',
        'DELETE /api/vitals/:id (protected)'
      ],
      ai: [
        'POST /api/ai/analyze (protected)',
        'GET /api/ai/insights (protected)',
        'GET /api/ai/insights/patient/:patientId (doctor only + approved access)',
        'GET /api/ai/insights/:id (protected)',
        'DELETE /api/ai/insights/:id (protected)'
      ],
      emergency: [
        'PUT /api/emergency (patient only) - create/update emergency profile',
        'GET /api/emergency/me (patient only) - get own emergency profile',
        'GET /api/emergency/public/:userId (public) - view emergency profile'
      ],
      appointments: [
        'POST /api/appointments (patient only) - book appointment',
        'GET /api/appointments/my (patient/doctor) - get my appointments',
        'PATCH /api/appointments/:appointmentId/status (patient/doctor) - update status'
      ],
      medications: [
        'POST /api/medications (patient only) - add medication reminder',
        'GET /api/medications (patient only) - get my reminders',
        'PATCH /api/medications/:id (patient only) - update reminder',
        'DELETE /api/medications/:id (patient only) - delete reminder'
      ],
      audit: [
        'GET /api/audit/my-history (patient only) - view my access history',
        'GET /api/audit/all (admin only) - view all audit logs'
      ],
      lab: [
        'POST /api/lab/upload/:patientId (lab only + approved access) - upload report for patient'
      ]
    }
  });
});

mainRoute.use("/auth", userRoute);

mainRoute.use("/admin", adminRoute);

mainRoute.use("/access", accessRoute);

mainRoute.use("/ai", aiRoute);

mainRoute.use("/vitals", vitalRoute);

mainRoute.use("/emergency", emergencyProfileRoute);

mainRoute.use("/appointments", appointmentRoute);

mainRoute.use("/medications", medicationReminderRoute);

mainRoute.use("/audit", auditLogRoute);

mainRoute.use("/lab", labReportRoute);

export default mainRoute;