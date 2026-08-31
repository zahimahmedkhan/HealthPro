import AuditLog from '../models/auditLogModel.js';

/**
 * Log an audit event. This function is fire-and-forget:
 * - It NEVER throws or rejects in a way that could break the calling request.
 * - Call sites should NOT await this blocking the response, but should call it
 *   before sending the response so it's queued.
 * - On failure, it only console.error's — never propagates errors.
 */
const logAudit = async ({ req, action, targetId, targetType, metadata, actorId: explicitActorId, actorRole: explicitActorRole }) => {
  try {
    const actorId = explicitActorId || req?.user?._id || null;
    const actorRole = explicitActorRole || req?.user?.role || 'anonymous';

    // Extract IP address from request
    const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || req?.ip
      || '';

    // Extract user agent
    const userAgent = req?.headers?.['user-agent'] || '';

    await AuditLog.create({
      actorId,
      actorRole,
      action,
      targetId: targetId || null,
      targetType: targetType || null,
      ipAddress,
      userAgent,
      metadata: metadata || null,
    });
  } catch (error) {
    // CRITICAL: Never throw — only log the error
    console.error('❌ Audit log failed:', error.message);
  }
};

export default logAudit;
