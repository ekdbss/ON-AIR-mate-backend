export const sendSuccess = (res, data, statusCode = 200) => {
    const response = {
        success: true,
        data,
        error: null,
    };
    res.status(statusCode).json(response);
};
export const sendError = (res, message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') => {
    const response = {
        success: false,
        data: null,
        error: {
            code,
            message,
        },
    };
    res.status(statusCode).json(response);
};
