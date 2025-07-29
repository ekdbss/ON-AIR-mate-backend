// src/middleware/errors/AppError.ts
import { ERROR_CODES, ErrorCode } from '../../constants/errorCodes.js';

export default class AppError extends Error {
  public statusCode: number;
  public errorCode: ErrorCode | string;
  public isOperational: boolean;
  public details?: any;

  constructor(errorCode: ErrorCode | string, customMessage?: string, details?: any) {
    // ERROR_CODES에 정의된 코드인 경우
    if (errorCode in ERROR_CODES) {
      const errorInfo = ERROR_CODES[errorCode as ErrorCode];
      super(customMessage || errorInfo.message);
      this.statusCode = errorInfo.statusCode;
      this.errorCode = errorCode;
    } else {
      // 커스텀 에러인 경우
      super(customMessage || '서버 내부 오류가 발생했습니다.');
      this.statusCode = 500;
      this.errorCode = 'GENERAL_004';
    }

    this.isOperational = true;
    this.details = details;

    // 스택 트레이스 유지
    Error.captureStackTrace(this, this.constructor);
  }

  // 이전 버전과의 호환성을 위한 정적 메서드
  static fromStatusCode(statusCode: number, message: string): AppError {
    const error = new AppError('GENERAL_004', message);
    error.statusCode = statusCode;
    return error;
  }
}
