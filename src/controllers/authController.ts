import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  createUser,
  findUserByNickname,
  findUserByUsername,
  updateUserToken,
  createUserAgreements,
  findUserByToken,
  clearUserToken,
} from '../services/authServices.js';

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

// 간단한 토큰 생성 함수
const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// 로그인
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // 유저 확인
    const user = await findUserByUsername(username);
    if (!user) {
      return sendError(
        res,
        '입력하신 정보가 잘못되었습니다. 아이디와 비밀번호를 정확히 입력해주세요.',
        401,
      );
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(
        res,
        '입력하신 정보가 잘못되었습니다. 아이디와 비밀번호를 정확히 입력해주세요.',
        401,
      );
    }

    // 간단한 토큰 생성 및 저장
    const token = generateToken();
    await updateUserToken(user.userId, token);

    console.log(`로그인 완료: ${user.userId}, ${user.nickname}`);

    sendSuccess(res, {
      accessToken: token,
      refreshToken: token, // API 명세서 준수를 위해 동일한 토큰 반환
      user: {
        userId: user.userId,
        nickname: user.nickname,
        profileImage: user.profileImage,
        popularity: user.popularity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 회원가입
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, nickname, profileImage, agreements } = req.body;

    // 닉네임 중복 확인
    const checkNickname = await findUserByNickname(nickname);
    if (checkNickname) {
      return sendError(res, '사용할 수 없는 닉네임입니다.', 409);
    }

    // 아이디 중복 확인
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return sendError(res, '사용할 수 없는 아이디입니다.', 409);
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 유저 생성
    const newUser = await createUser({
      loginId: username, // DB 필드명은 loginId
      password: hashedPassword,
      nickname,
      profileImage: profileImage || null,
    });

    // 약관 동의 정보 저장
    if (agreements) {
      await createUserAgreements(newUser.userId, agreements);
    }

    sendSuccess(res, { message: '회원가입이 완료되었습니다.' }, 201);
  } catch (err) {
    next(err);
  }
};

// 닉네임 중복 확인
export const checkNickname = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nickname } = req.params;

    // 닉네임 형식 검증 (3~10자)
    if (nickname.length < 3 || nickname.length > 10) {
      return sendSuccess(res, {
        available: false,
        message: '닉네임은 3~10자 이내로 입력해주세요.',
      });
    }

    const existingUser = await findUserByNickname(nickname);

    if (existingUser) {
      sendSuccess(res, {
        available: false,
        message: '사용할 수 없는 닉네임입니다.',
      });
    } else {
      sendSuccess(res, {
        available: true,
        message: '사용할 수 있는 닉네임입니다.',
      });
    }
  } catch (err) {
    next(err);
  }
};

// 토큰 갱신
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, '리프레시 토큰이 필요합니다.', 401);
    }

    // 토큰으로 유저 찾기
    const user = await findUserByToken(refreshToken);
    if (!user) {
      return sendError(res, '유효하지 않은 리프레시 토큰입니다.', 401);
    }

    // 새로운 토큰 생성
    const newToken = generateToken();
    await updateUserToken(user.userId, newToken);

    sendSuccess(res, {
      accessToken: newToken,
    });
  } catch (err) {
    next(err);
  }
};

// 로그아웃
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth 미들웨어를 통해 이미 인증된 사용자
    const userId = req.user?.userId;

    if (userId) {
      // DB에서 토큰 삭제
      await clearUserToken(userId);
    }

    sendSuccess(res, { message: '로그아웃되었습니다.' });
  } catch (err) {
    next(err);
  }
};
