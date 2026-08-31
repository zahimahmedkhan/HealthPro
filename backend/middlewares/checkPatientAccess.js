import AccessGrant from '../models/accessGrantModel.js';

const checkPatientAccess = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        if (!patientId) {
            return res.status(400).send({
                status: 400,
                message: 'Patient ID is required',
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(patientId)) {
            return res.status(400).send({
                status: 400,
                message: 'Invalid patient ID format',
            });
        }

        if (!req.user || !['doctor', 'lab'].includes(req.user.role)) {
            return res.status(403).send({
                status: 403,
                message: 'Only doctors and labs can access patient records',
            });
        }

        const accessGrant = await AccessGrant.findOne({
            patientId,
            doctorId: req.user._id,
            status: 'approved',
        });

        if (!accessGrant) {
            return res.status(403).send({
                status: 403,
                message: 'You do not have access to this patient\'s records',
            });
        }

        next();
    } catch (error) {
        console.error('Check Patient Access Error:', error.message);
        return res.status(500).send({
            status: 500,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export default checkPatientAccess;
