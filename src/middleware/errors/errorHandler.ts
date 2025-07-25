// src/middleware/errors/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import AppError from './AppError.js';
import { sendError } from '../../utils/response.js';

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  void _next;

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // AppError 인스턴스인 경우
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }

  // Prisma 에러 처리
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;

    // P2002: Unique constraint failed
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      return sendError(res, `이미 사용 중인 ${field}입니다.`, 409, 'GENERAL_001');
    }

    // P2025: Record not found
    if (prismaError.code === 'P2025') {
      return sendError(res, '요청한 데이터를 찾을 수 없습니다.', 404, 'GENERAL_003');
    }

    // 기타 Prisma 에러
    console.error('Prisma Error:', prismaError);
    return sendError(res, '데이터베이스 오류가 발생했습니다.', 500, 'GENERAL_005');
  }

  // 기타 모든 에러
  console.error('Unhandled Error:', err);
  return sendError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : '서버 내부 오류가 발생했습니다.',
    500,
    'GENERAL_004',
  );
};

export default errorHandler;
