import { sendResponse } from '../utils/sendResponse.js'
import vitalSchemModel from '../models/vitalsSchema.js'
import logAudit from '../utils/logAudit.js'

const addVital = async (req, res) => {
    try {
        const { bloodPressure, heartRate, temperature, oxygenSaturation } = req.body;

        if (!bloodPressure || !heartRate || !temperature || !oxygenSaturation) {
            return sendResponse(res, 400, "All vital parameters are required");
        }

        const vital = await vitalSchemModel.create({
            bloodPressure,
            heartRate,
            temperature,
            oxygenSaturation,
            userId: req.user._id
        });

        sendResponse(res, 201, "Vital added successfully", { vital });
    } catch (error) {
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const deleteVital = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return sendResponse(res, 400, "Vital ID is required");
        }

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, "Invalid vital ID format");
        }

        // Delete only if owned by the current user
        const vital = await vitalSchemModel.findOneAndDelete({ 
            _id: id, 
            userId: req.user._id 
        });

        if (!vital) {
            return sendResponse(res, 404, "Vital not found or not authorized");
        }

        sendResponse(res, 200, "Vital deleted successfully");
    } catch (error) {
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const getAllVitals = async (req, res) => {
    try {
        const vitals = await vitalSchemModel.find({ userId: req.user._id });

        sendResponse(res, 200, "All vitals retrieved successfully", { vitals });
    } catch (error) {
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const getSingleVital = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return sendResponse(res, 400, "Vital ID is required");
        }

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, "Invalid vital ID format");
        }

        // Filter by both _id and userId to ensure ownership
        const vital = await vitalSchemModel.findOne({ 
            _id: id, 
            userId: req.user._id 
        });

        if (!vital) {
            return sendResponse(res, 404, "Vital not found");
        }

        sendResponse(res, 200, "Vital retrieved successfully", { vital });
    } catch (error) {
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const getPatientVitals = async (req, res) => {
    try {
        const { patientId } = req.params;

        if (!patientId) {
            return sendResponse(res, 400, "Patient ID is required");
        }

        if (!patientId.match(/^[0-9a-fA-F]{24}$/)) {
            return sendResponse(res, 400, "Invalid patient ID format");
        }

        const vitals = await vitalSchemModel.find({ userId: patientId });

        // Audit log: doctor viewed patient vitals
        logAudit({ req, action: 'VIEW_PATIENT_VITALS', targetId: patientId, targetType: 'Vital' });

        sendResponse(res, 200, "Patient vitals retrieved successfully", { vitals });
    } catch (error) {
        sendResponse(res, 500, "Internal server error", { error: error.message });
    }
};

export { addVital, getAllVitals, getSingleVital, deleteVital, getPatientVitals }
