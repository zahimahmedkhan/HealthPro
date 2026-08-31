import Appointment from '../models/appointmentModel.js';
import AccessGrant from '../models/accessGrantModel.js';
import User from '../models/userModel.js';
import { sendResponse } from '../utils/sendResponse.js';
import logAudit from '../utils/logAudit.js';

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, dateTime, reason } = req.body;

    if (!doctorId) {
      return sendResponse(res, 400, 'Doctor ID is required');
    }

    if (!dateTime) {
      return sendResponse(res, 400, 'Appointment date and time is required');
    }

    // Validate the doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return sendResponse(res, 404, 'Doctor not found');
    }

    if (doctor.role !== 'doctor') {
      return sendResponse(res, 400, 'Selected user is not a doctor');
    }

    // Verify approved AccessGrant exists between this patient and the doctor
    const accessGrant = await AccessGrant.findOne({
      patientId: req.user._id,
      doctorId: doctorId,
      status: 'approved',
    });

    if (!accessGrant) {
      return sendResponse(
        res,
        403,
        'You do not have an approved access grant with this doctor. Please request access first via the Access Requests page.'
      );
    }

    // Validate dateTime is in the future
    const appointmentDate = new Date(dateTime);
    if (isNaN(appointmentDate.getTime())) {
      return sendResponse(res, 400, 'Invalid date/time format');
    }

    if (appointmentDate <= new Date()) {
      return sendResponse(res, 400, 'Appointment must be scheduled for a future date and time');
    }

    // Check for conflicting appointments (same doctor, same time, not cancelled)
    const conflict = await Appointment.findOne({
      doctorId: doctorId,
      dateTime: appointmentDate,
      status: { $in: ['requested', 'confirmed'] },
    });

    if (conflict) {
      return sendResponse(res, 409, 'This doctor already has an appointment at the selected time');
    }

    // Validate reason length
    if (reason && reason.length > 300) {
      return sendResponse(res, 400, 'Reason cannot exceed 300 characters');
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctorId,
      dateTime: appointmentDate,
      reason: reason || '',
      status: 'requested',
    });

    // Populate doctor info for response
    await appointment.populate('doctorId', 'userName email');

    // Audit log: appointment booked
    logAudit({ req, action: 'APPOINTMENT_BOOKED', targetId: doctorId, targetType: 'Appointment' });

    sendResponse(res, 201, 'Appointment booked successfully', { appointment });
  } catch (error) {
    console.error('Book Appointment Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id;
    } else {
      return sendResponse(res, 403, 'Only patients and doctors can access appointments');
    }

    const appointments = await Appointment.find(filter)
      .sort({ dateTime: -1 })
      .populate('patientId', 'userName email')
      .populate('doctorId', 'userName email')
      .lean();

    sendResponse(res, 200, 'Appointments retrieved successfully', { appointments });
  } catch (error) {
    console.error('Get My Appointments Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    if (!appointmentId) {
      return sendResponse(res, 400, 'Appointment ID is required');
    }

    if (!status) {
      return sendResponse(res, 400, 'Status is required');
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return sendResponse(res, 404, 'Appointment not found');
    }

    // Role-based status update rules
    if (req.user.role === 'doctor') {
      // Doctor can set to confirmed, completed, or cancelled
      if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
        return sendResponse(res, 400, 'Doctor can only set status to confirmed, completed, or cancelled');
      }

      // Doctor must own this appointment
      if (appointment.doctorId.toString() !== req.user._id.toString()) {
        return sendResponse(res, 403, 'You can only update your own appointments');
      }

      // Update notes if provided
      if (notes !== undefined) {
        if (notes.length > 500) {
          return sendResponse(res, 400, 'Notes cannot exceed 500 characters');
        }
        appointment.notes = notes;
      }
    } else if (req.user.role === 'patient') {
      // Patient can only cancel requested or confirmed appointments
      if (status !== 'cancelled') {
        return sendResponse(res, 400, 'Patients can only cancel appointments');
      }

      // Patient must own this appointment
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return sendResponse(res, 403, 'You can only update your own appointments');
      }

      // Can only cancel requested or confirmed
      if (!['requested', 'confirmed'].includes(appointment.status)) {
        return sendResponse(res, 400, `Cannot cancel an appointment with status: ${appointment.status}`);
      }
    } else {
      return sendResponse(res, 403, 'Only patients and doctors can update appointments');
    }

    appointment.status = status;
    await appointment.save();

    // Populate for response
    await appointment.populate('patientId', 'userName email');
    await appointment.populate('doctorId', 'userName email');

    // Audit log: appointment status updated
    logAudit({
        req,
        action: 'APPOINTMENT_STATUS_UPDATED',
        targetId: appointment._id,
        targetType: 'Appointment',
        metadata: { newStatus: status },
    });

    sendResponse(res, 200, 'Appointment status updated successfully', { appointment });
  } catch (error) {
    console.error('Update Appointment Status Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

export { bookAppointment, getMyAppointments, updateAppointmentStatus };
