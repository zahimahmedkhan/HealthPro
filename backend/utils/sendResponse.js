export const sendResponse = (res, status, message, extraFields = {}) => {
    return res.status(status).send({
        status,
        message,
        ...extraFields
    });
};
