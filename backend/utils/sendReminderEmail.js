import transporter from '../config/nodeMailer.js';
import User from '../models/userModel.js';

/**
 * Send a medication reminder email to a user
 */
const sendMedicationReminder = async (userId, medicineName, dosage) => {
  try {
    const user = await User.findById(userId).select('userName email').lean();

    if (!user || !user.email) {
      console.warn(`⚠️ No email found for user ${userId}, skipping medication reminder`);
      return;
    }

    const mailOptions = {
      from: process.env.USER_EMAIL || process.env.EMAIL_USER,
      to: user.email,
      subject: `Medication Reminder - ${medicineName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">💊 Medication Reminder</h2>
          <p>Hi ${user.userName || 'Patient'},</p>
          <p>This is a friendly reminder to take your medication:</p>
          <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #86efac;">
            <p style="margin: 0; font-size: 18px;"><strong>${medicineName}</strong></p>
            ${dosage ? `<p style="margin: 8px 0 0 0; color: #166534;">Dosage: ${dosage}</p>` : ''}
          </div>
          <p style="margin-top: 16px; color: #6b7280;">Stay healthy! 💚</p>
          <p style="color: #9ca3af; font-size: 12px;">HealthPro Healthcare System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Medication reminder sent to ${user.email} for ${medicineName}`);
  } catch (error) {
    console.error(`❌ Failed to send medication reminder to user ${userId}:`, error.message);
  }
};

/**
 * Send an appointment reminder email to a patient
 */
const sendAppointmentReminder = async (patientId, doctorName, appointmentDateTime) => {
  try {
    const patient = await User.findById(patientId).select('userName email').lean();

    if (!patient || !patient.email) {
      console.warn(`⚠️ No email found for patient ${patientId}, skipping appointment reminder`);
      return;
    }

    const formattedDate = new Date(appointmentDateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.USER_EMAIL || process.env.EMAIL_USER,
      to: patient.email,
      subject: `Appointment Reminder - Tomorrow at ${new Date(appointmentDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">📅 Appointment Reminder</h2>
          <p>Hi ${patient.userName || 'Patient'},</p>
          <p>This is a reminder that you have an upcoming appointment:</p>
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; border: 1px solid #93c5fd;">
            <p style="margin: 0; font-size: 18px;"><strong>Dr. ${doctorName}</strong></p>
            <p style="margin: 8px 0 0 0; color: #1e40af;">${formattedDate}</p>
          </div>
          <p style="margin-top: 16px; color: #6b7280;">Please arrive on time. If you need to cancel, you can do so from your dashboard.</p>
          <p style="color: #9ca3af; font-size: 12px;">HealthPro Healthcare System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Appointment reminder sent to ${patient.email} for appointment with Dr. ${doctorName}`);
  } catch (error) {
    console.error(`❌ Failed to send appointment reminder to patient ${patientId}:`, error.message);
  }
};

export { sendMedicationReminder, sendAppointmentReminder };
