import mongoose from 'mongoose';

const emergencyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    currentMedications: {
      type: [String],
      default: [],
    },
    emergencyContacts: {
      type: [
        {
          name: { type: String, required: true },
          relation: { type: String, required: true },
          phone: { type: String, required: true },
        },
      ],
      default: [],
      validate: {
        validator: function (contacts) {
          return contacts.length <= 3;
        },
        message: 'Emergency contacts cannot exceed 3 entries',
      },
    },
    organDonor: {
      type: Boolean,
      default: false,
    },
    additionalNotes: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const EmergencyProfile = mongoose.model('EmergencyProfile', emergencyProfileSchema);

export default EmergencyProfile;
