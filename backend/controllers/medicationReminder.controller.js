import MedicationReminder from '../models/medicationReminderModel.js';
import { sendResponse } from '../utils/sendResponse.js';

const addReminder = async (req, res) => {
  try {
    const { medicineName, dosage, frequency, times, startDate, endDate, active } = req.body;

    if (!medicineName || !medicineName.trim()) {
      return sendResponse(res, 400, 'Medicine name is required');
    }

    if (!startDate) {
      return sendResponse(res, 400, 'Start date is required');
    }

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return sendResponse(res, 400, 'Invalid start date format');
    }

    // Validate endDate if provided
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return sendResponse(res, 400, 'Invalid end date format');
      }
      if (parsedEndDate <= parsedStartDate) {
        return sendResponse(res, 400, 'End date must be after start date');
      }
    }

    // Validate times format (HH:mm)
    if (Array.isArray(times)) {
      for (const time of times) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
          return sendResponse(res, 400, `Invalid time format: ${time}. Use HH:mm (24-hour) format`);
        }
      }
    }

    const reminder = await MedicationReminder.create({
      userId: req.user._id,
      medicineName: medicineName.trim(),
      dosage: dosage || '',
      frequency: frequency || '',
      times: Array.isArray(times) ? times : [],
      startDate: parsedStartDate,
      endDate: endDate ? new Date(endDate) : null,
      active: typeof active === 'boolean' ? active : true,
    });

    sendResponse(res, 201, 'Medication reminder created successfully', { reminder });
  } catch (error) {
    console.error('Add Reminder Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const getMyReminders = async (req, res) => {
  try {
    const reminders = await MedicationReminder.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    sendResponse(res, 200, 'Medication reminders retrieved successfully', { reminders });
  } catch (error) {
    console.error('Get My Reminders Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicineName, dosage, frequency, times, startDate, endDate, active } = req.body;

    if (!id) {
      return sendResponse(res, 400, 'Reminder ID is required');
    }

    const reminder = await MedicationReminder.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!reminder) {
      return sendResponse(res, 404, 'Medication reminder not found');
    }

    // Update fields if provided
    if (medicineName !== undefined) {
      if (!medicineName || !medicineName.trim()) {
        return sendResponse(res, 400, 'Medicine name cannot be empty');
      }
      reminder.medicineName = medicineName.trim();
    }

    if (dosage !== undefined) reminder.dosage = dosage;
    if (frequency !== undefined) reminder.frequency = frequency;

    if (times !== undefined) {
      if (Array.isArray(times)) {
        for (const time of times) {
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
            return sendResponse(res, 400, `Invalid time format: ${time}. Use HH:mm (24-hour) format`);
          }
        }
        reminder.times = times;
      }
    }

    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return sendResponse(res, 400, 'Invalid start date format');
      }
      reminder.startDate = parsedStartDate;
    }

    if (endDate !== undefined) {
      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return sendResponse(res, 400, 'Invalid end date format');
        }
        reminder.endDate = parsedEndDate;
      } else {
        reminder.endDate = null;
      }
    }

    if (active !== undefined) {
      reminder.active = typeof active === 'boolean' ? active : false;
    }

    await reminder.save();

    sendResponse(res, 200, 'Medication reminder updated successfully', { reminder });
  } catch (error) {
    console.error('Update Reminder Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(res, 400, 'Reminder ID is required');
    }

    const reminder = await MedicationReminder.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!reminder) {
      return sendResponse(res, 404, 'Medication reminder not found');
    }

    sendResponse(res, 200, 'Medication reminder deleted successfully');
  } catch (error) {
    console.error('Delete Reminder Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

export { addReminder, getMyReminders, updateReminder, deleteReminder };
