import { Request, Response, NextFunction } from 'express';
import { findUserByToken } from '../services/authServices.js';
import { sendError } from '../utils/response.js';

// Express Request 타입 확장
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      nickname: string;
      userId: number;
    };
  }
}

/**
 * 간단한 토큰 인증 미들웨어
 * Authorization: Bearer {token} 형식으로 토큰을 받아서 검증
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, '인증이 필요합니다.', 401);
    }

    // 토큰 추출
    const token = authHeader.substring(7); // "Bearer " 제거

    if (!token) {
      return sendError(res, '인증이 필요합니다.', 401);
    }

    // DB에서 토큰으로 유저 찾기
    const user = await findUserByToken(token);

    if (!user) {
      return sendError(res, '유효하지 않은 토큰입니다.', 401);
    }

    // req.user에 유저 정보 저장
    req.user = {
      id: user.userId.toString(),
      nickname: user.nickname,
      userId: user.userId,
    };

    next();
  } catch {
    return sendError(res, '인증 처리 중 오류가 발생했습니다.', 500);
  }
};

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 유저 정보를 추가하고, 없어도 통과
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        const user = await findUserByToken(token);

        if (user) {
          req.user = {
            id: user.userId.toString(),
            nickname: user.nickname,
            userId: user.userId,
          };
        }
      }
    }

    next();
  } catch {
    next();
  }
};
