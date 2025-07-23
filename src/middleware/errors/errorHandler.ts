/**
 * ON-AIR-mate 백엔드 메인 애플리케이션
 * Express.js 기반 REST API 서버
 */
import { Request, Response, NextFunction } from 'express';

import AppError from './AppError.js';
import { sendError } from '../../utils/response.js';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  next();
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  console.error(err);

  return sendError(res, 'Internal Server Error');
};

export default errorHandler;
