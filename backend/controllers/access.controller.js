import User from '../models/userModel.js';
import AccessGrant from '../models/accessGrantModel.js';
import { sendResponse } from '../utils/sendResponse.js';
import logAudit from '../utils/logAudit.js';

const normalizeScope = (scope) => {
    const allowedScopes = ['vitals', 'reports'];
    const values = Array.isArray(scope) ? scope : [];

    const normalized = values
        .filter((item) => allowedScopes.includes(item))
        .map((item) => item.trim());

    return normalized.length > 0 ? [...new Set(normalized)] : ['vitals', 'reports'];
};

const searchPatients = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || !query.toString().trim()) {
            return sendResponse(res, 400, 'Search query is required');
        }

        const searchTerm = query.toString().trim();
        const patientQuery = {
            role: 'patient',
            $or: [
                { userName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
            ],
        };

        const patients = await User.find(patientQuery)
            .select('_id userName email avatar role')
            .limit(10)
            .lean();

        sendResponse(res, 200, 'Matching patients retrieved successfully', { patients });
    } catch (error) {
        console.error('Search Patients Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

const requestAccess = async (req, res) => {
    try {
        const { patientId, patientEmail, patientName, scope } = req.body;

        if (!req.user || !['doctor', 'lab'].includes(req.user.role)) {
            return sendResponse(res, 403, 'Only doctors and labs can request patient access');
        }

        let patient = null;

        if (patientId) {
            patient = await User.findById(patientId);
        } else if (patientEmail) {
            patient = await User.findOne({ email: patientEmail.trim() });
        } else if (patientName) {
            patient = await User.findOne({ userName: patientName.trim() });
        }

        if (!patient) {
            return sendResponse(res, 404, 'Patient not found');
        }

        if (patient.role !== 'patient') {
            return sendResponse(res, 400, 'Only patient accounts can be shared');
        }

        if (patient._id.toString() === req.user._id.toString()) {
            return sendResponse(res, 400, 'You cannot request access to your own records');
        }

        const existingGrant = await AccessGrant.findOne({
            patientId: patient._id,
            doctorId: req.user._id,
        }).sort({ createdAt: -1 });

        if (existingGrant && existingGrant.status !== 'revoked') {
            const message = existingGrant.status === 'pending'
                ? 'A request for this patient is already pending'
                : 'This patient has already approved your access';
            return sendResponse(res, 409, message, { grant: existingGrant });
        }

        const newGrant = await AccessGrant.create({
            patientId: patient._id,
            doctorId: req.user._id,
            granteeType: req.user.role,
            scope: normalizeScope(scope),
            status: 'pending',
        });

        // Audit log: access request sent
        logAudit({ req, action: 'ACCESS_REQUEST_SENT', targetId: patient._id, targetType: 'AccessGrant' });

        sendResponse(res, 201, 'Access request sent successfully', { grant: newGrant });
    } catch (error) {
        console.error('Request Access Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

const respondToAccessRequest = async (req, res) => {
    try {
        const { grantId, decision } = req.body;

        if (!req.user || req.user.role !== 'patient') {
            return sendResponse(res, 403, 'Only patients can respond to access requests');
        }

        if (!grantId) {
            return sendResponse(res, 400, 'Grant ID is required');
        }

        if (!decision || !['approve', 'deny'].includes(decision)) {
            return sendResponse(res, 400, 'Decision must be either approve or deny');
        }

        const grant = await AccessGrant.findOne({
            _id: grantId,
            patientId: req.user._id,
        });

        if (!grant) {
            return sendResponse(res, 404, 'Access request not found');
        }

        if (grant.status === 'revoked') {
            return sendResponse(res, 400, 'This access request has already been closed');
        }

        if (decision === 'approve') {
            grant.status = 'approved';
            grant.grantedAt = new Date();
            grant.revokedAt = null;
        } else {
            grant.status = 'revoked';
            grant.revokedAt = new Date();
        }

        await grant.save();

        const finalMessage = decision === 'approve'
            ? 'Access request approved successfully'
            : 'Access request denied successfully';

        // Audit log: access request responded
        logAudit({
            req,
            action: decision === 'approve' ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_DENIED',
            targetId: grant.doctorId,
            targetType: 'AccessGrant',
        });

        sendResponse(res, 200, finalMessage, { grant });
    } catch (error) {
        console.error('Respond To Access Request Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

const getMyAccessGrants = async (req, res) => {
    try {
        const grants = await AccessGrant.find({ patientId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('doctorId', '_id userName email avatar role')
            .lean();

        const formattedGrants = grants.map((grant) => ({
            ...grant,
            doctor: grant.doctorId,
        }));

        sendResponse(res, 200, 'Access requests retrieved successfully', { grants: formattedGrants });
    } catch (error) {
        console.error('Get My Access Grants Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

const getMyPatients = async (req, res) => {
    try {
        const grants = await AccessGrant.find({
            doctorId: req.user._id,
            status: 'approved',
        })
            .sort({ grantedAt: -1 })
            .populate('patientId', '_id userName email avatar role')
            .lean();

        const patients = grants.map((grant) => ({
            grantId: grant._id,
            patientId: grant.patientId?._id,
            userName: grant.patientId?.userName,
            email: grant.patientId?.email,
            avatar: grant.patientId?.avatar,
            grantedAt: grant.grantedAt,
            scope: grant.scope,
        }));

        sendResponse(res, 200, 'Approved patients retrieved successfully', { patients });
    } catch (error) {
        console.error('Get My Patients Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

const revokeAccess = async (req, res) => {
    try {
        const { grantId } = req.params;

        if (!grantId) {
            return sendResponse(res, 400, 'Grant ID is required');
        }

        const grant = await AccessGrant.findOne({
            _id: grantId,
            patientId: req.user._id,
            status: 'approved',
        });

        if (!grant) {
            return sendResponse(res, 404, 'Approved access grant not found');
        }

        grant.status = 'revoked';
        grant.revokedAt = new Date();
        await grant.save();

        // Audit log: access revoked
        logAudit({ req, action: 'ACCESS_REVOKED', targetId: grant.doctorId, targetType: 'AccessGrant' });

        sendResponse(res, 200, 'Access revoked successfully', { grant });
    } catch (error) {
        console.error('Revoke Access Error:', error.message);
        sendResponse(res, 500, 'Internal server error', { error: error.message });
    }
};

export {
    searchPatients,
    requestAccess,
    respondToAccessRequest,
    getMyAccessGrants,
    getMyPatients,
    revokeAccess,
};
