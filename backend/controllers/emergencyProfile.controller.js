import EmergencyProfile from '../models/emergencyProfileModel.js';
import User from '../models/userModel.js';
import { sendResponse } from '../utils/sendResponse.js';
import logAudit from '../utils/logAudit.js';

const upsertEmergencyProfile = async (req, res) => {
  try {
    const {
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      emergencyContacts,
      organDonor,
      additionalNotes,
    } = req.body;

    // Validate emergency contacts max 3
    if (Array.isArray(emergencyContacts) && emergencyContacts.length > 3) {
      return sendResponse(res, 400, 'Emergency contacts cannot exceed 3 entries');
    }

    // Validate additionalNotes length
    if (additionalNotes && additionalNotes.length > 500) {
      return sendResponse(res, 400, 'Additional notes cannot exceed 500 characters');
    }

    const profileData = {
      userId: req.user._id,
      bloodGroup: bloodGroup || 'Unknown',
      allergies: Array.isArray(allergies) ? allergies : [],
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
      currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
      emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : [],
      organDonor: typeof organDonor === 'boolean' ? organDonor : false,
      additionalNotes: additionalNotes || '',
    };

    const profile = await EmergencyProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    sendResponse(res, 200, 'Emergency profile saved successfully', { profile });
  } catch (error) {
    console.error('Upsert Emergency Profile Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const getMyEmergencyProfile = async (req, res) => {
  try {
    const profile = await EmergencyProfile.findOne({ userId: req.user._id }).lean();

    if (!profile) {
      // Return empty/default shape so the frontend form can render cleanly
      return sendResponse(res, 200, 'No emergency profile found', {
        profile: {
          bloodGroup: 'Unknown',
          allergies: [],
          chronicConditions: [],
          currentMedications: [],
          emergencyContacts: [],
          organDonor: false,
          additionalNotes: '',
        },
      });
    }

    sendResponse(res, 200, 'Emergency profile retrieved successfully', { profile });
  } catch (error) {
    console.error('Get My Emergency Profile Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const getPublicEmergencyProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, 400, 'User ID is required');
    }

    const profile = await EmergencyProfile.findOne({ userId }).lean();

    if (!profile) {
      return sendResponse(res, 404, 'No emergency profile available for this user');
    }

    // Fetch patient name from User model
    const user = await User.findById(userId).select('userName').lean();

    // Audit log: public emergency profile viewed (anonymous viewer)
    logAudit({ req, action: 'VIEW_EMERGENCY_PROFILE_PUBLIC', targetId: userId, targetType: 'EmergencyProfile' });

    // NEVER include email, password hash, or any other account field
    sendResponse(res, 200, 'Emergency profile retrieved successfully', {
      profile: {
        userName: user?.userName || 'Unknown Patient',
        bloodGroup: profile.bloodGroup,
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
        currentMedications: profile.currentMedications,
        emergencyContacts: profile.emergencyContacts,
        organDonor: profile.organDonor,
        additionalNotes: profile.additionalNotes,
      },
    });
  } catch (error) {
    console.error('Get Public Emergency Profile Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

export { upsertEmergencyProfile, getMyEmergencyProfile, getPublicEmergencyProfile };
