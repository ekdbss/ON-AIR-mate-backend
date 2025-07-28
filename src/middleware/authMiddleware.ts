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
    // 개발 환경에서는 무조건 인증 우회
    // if (process.env.NODE_ENV === 'development') {
    //   req.user = {
    //     id: '1',
    //     nickname: '테스트사용자',
    //     userId: 1,
    //   };
    //   console.log('개발 환경: 인증 우회');
    //   return next();
    // }

    // 프로덕션에서는 정상 인증 처리
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, '인증이 필요합니다.', 401);
    }

    // 토큰 추출
    const token = authHeader.substring(7);

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
    // 개발 환경에서는 기본 사용자 설정
    if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
      req.user = {
        id: '1',
        nickname: '테스트사용자',
        userId: 1,
      };
      return next();
    }

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
