import mongoose from 'mongoose';

const medicationReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      default: '',
    },
    frequency: {
      type: String,
      default: '',
    },
    times: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const MedicationReminder = mongoose.model('MedicationReminder', medicationReminderSchema);

export default MedicationReminder;
