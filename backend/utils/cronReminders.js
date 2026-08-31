import cron from 'node-cron';
import MedicationReminder from '../models/medicationReminderModel.js';
import Appointment from '../models/appointmentModel.js';
import User from '../models/userModel.js';
import { sendMedicationReminder, sendAppointmentReminder } from './sendReminderEmail.js';

/**
 * Check and send medication reminders
 * Runs every 15 minutes, checks if any medication times fall within the current window
 */
const checkMedicationReminders = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Calculate the 15-minute window: current time to current time + 15 minutes
    const windowStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const endMinute = currentMinute + 15;
    const windowEndHour = currentHour + Math.floor(endMinute / 60);
    const windowEndMinute = endMinute % 60;
    const windowEnd = `${String(windowEndHour).padStart(2, '0')}:${String(windowEndMinute).padStart(2, '0')}`;

    // Find active reminders where startDate <= now and (endDate is null or endDate >= now)
    const reminders = await MedicationReminder.find({
      active: true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    }).lean();

    for (const reminder of reminders) {
      try {
        // Check if any of the reminder's times fall within the current 15-minute window
        const shouldRemind = reminder.times.some((time) => {
          const [hour, minute] = time.split(':').map(Number);
          const reminderTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

          // Check if reminder time is within the window
          if (windowStart <= windowEnd) {
            // Normal case (e.g., 08:00 to 08:15)
            return reminderTime >= windowStart && reminderTime < windowEnd;
          } else {
            // Window wraps around midnight (e.g., 23:45 to 00:00)
            return reminderTime >= windowStart || reminderTime < windowEnd;
          }
        });

        if (shouldRemind) {
          await sendMedicationReminder(reminder.userId, reminder.medicineName, reminder.dosage);
        }
      } catch (error) {
        console.error(`❌ Error processing medication reminder ${reminder._id}:`, error.message);
        // Continue with next reminder
      }
    }
  } catch (error) {
    console.error('❌ Error in checkMedicationReminders:', error.message);
  }
};

/**
 * Check and send appointment reminders
 * Runs every 15 minutes, checks for confirmed appointments between 23-25 hours from now
 */
const checkAppointmentReminders = async () => {
  try {
    const now = new Date();

    // Define the 24-hour-ahead reminder window (23 to 25 hours from now)
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find confirmed appointments within the window that haven't been reminded yet
    const appointments = await Appointment.find({
      status: 'confirmed',
      reminderSent: false,
      dateTime: {
        $gte: reminderWindowStart,
        $lte: reminderWindowEnd,
      },
    })
      .populate('doctorId', 'userName')
      .lean();

    for (const appointment of appointments) {
      try {
        // Fetch doctor name if not already populated
        let doctorName = appointment.doctorId?.userName;
        if (!doctorName) {
          const doctor = await User.findById(appointment.doctorId).select('userName').lean();
          doctorName = doctor?.userName || 'Unknown Doctor';
        }

        // Send reminder to the patient
        await sendAppointmentReminder(appointment.patientId, doctorName, appointment.dateTime);

        // Mark reminder as sent to prevent duplicates
        await Appointment.findByIdAndUpdate(appointment._id, { reminderSent: true });
      } catch (error) {
        console.error(`❌ Error processing appointment reminder ${appointment._id}:`, error.message);
        // Continue with next appointment
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAppointmentReminders:', error.message);
  }
};

/**
 * Start all cron jobs
 */
const startCronJobs = () => {
  // Medication reminders - every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('⏰ Running medication reminder check...');
    checkMedicationReminders();
  });

  // Appointment reminders - every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('⏰ Running appointment reminder check...');
    checkAppointmentReminders();
  });

  console.log('✅ Cron jobs started (medication + appointment reminders every 15 minutes)');
};

export { startCronJobs };
