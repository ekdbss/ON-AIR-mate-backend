import AppError from './AppError.js';
import { sendError } from '../../utils/response.js';
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return sendError(res, err.message, err.statusCode);
    }
    console.error(err);
    return sendError(res, 'Internal Server Error');
};
export default errorHandler;
