import { Request, Response, NextFunction } from 'express';
import AppError from './AppError.js';
import { sendError } from '../../utils/response.js';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  console.error(err);

  return sendError(res, 'Internal Server Error');
};

export default errorHandler;
