import AuditLog from '../models/auditLogModel.js';
import { sendResponse } from '../utils/sendResponse.js';

// Actions that represent "someone viewed/accessed my data"
const PATIENT_ACCESS_ACTIONS = [
  'VIEW_PATIENT_VITALS',
  'VIEW_PATIENT_INSIGHTS',
  'VIEW_EMERGENCY_PROFILE_PUBLIC',
  'ACCESS_REQUEST_SENT',
  'ACCESS_REQUEST_APPROVED',
  'ACCESS_REQUEST_DENIED',
  'ACCESS_REVOKED',
];

const getMyAccessHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const filter = {
      targetId: req.user._id,
      action: { $in: PATIENT_ACCESS_ACTIONS },
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'userName role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Access history retrieved successfully', {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get My Access History Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

const getAllAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const filter = {};

    // Optional filters
    if (req.query.action) {
      filter.action = req.query.action;
    }

    if (req.query.actorId) {
      filter.actorId = req.query.actorId;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'userName role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Audit logs retrieved successfully', {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Audit Logs Error:', error.message);
    sendResponse(res, 500, 'Internal server error', { error: error.message });
  }
};

export { getMyAccessHistory, getAllAuditLogs };
