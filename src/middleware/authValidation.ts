import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

/**
 * 로그인 입력값 검증
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return sendError(res, '아이디와 비밀번호를 입력해주세요.', 400);
  }

  if (username.trim().length === 0 || password.trim().length === 0) {
    return sendError(res, '아이디와 비밀번호를 입력해주세요.', 400);
  }

  next();
};

/**
 * 회원가입 입력값 검증
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { username, password, nickname, agreements } = req.body;

  // 필수 필드 검증
  if (!username || !password || !nickname) {
    return sendError(res, '필수 정보를 모두 입력해주세요.', 400);
  }

  // 아이디 검증
  if (username.trim().length === 0) {
    return sendError(res, '아이디를 입력해주세요.', 400);
  }

  // 비밀번호 검증 (8~16자의 영문 대/소문자, 숫자, 특수문자)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
  if (!passwordRegex.test(password)) {
    return sendError(res, '8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해주세요.', 400);
  }

  // 닉네임 검증 (3~10자)
  if (nickname.length < 3 || nickname.length > 10) {
    return sendError(res, '닉네임은 3~10자 이내로 입력해주세요.', 400);
  }

  // 필수 약관 동의 검증
  if (agreements) {
    if (!agreements.serviceTerms || !agreements.privacyCollection || !agreements.privacyPolicy) {
      return sendError(res, '필수 약관에 동의해주세요.', 400);
    }
  }

  next();
};

/**
 * 닉네임 검증
 */
export const validateNickname = (req: Request, res: Response, next: NextFunction) => {
  const { nickname } = req.params;

  if (!nickname || nickname.trim().length === 0) {
    return sendError(res, '닉네임을 입력해주세요.', 400);
  }

  // 닉네임 형식 검증 (특수문자 제한 등 추가 가능)
  const nicknameRegex = /^[가-힣a-zA-Z0-9_-]{3,10}$/;
  if (!nicknameRegex.test(nickname)) {
    return sendError(res, '닉네임은 3~10자의 한글, 영문, 숫자, -, _만 사용 가능합니다.', 400);
  }

  next();
};

/**
 * 리프레시 토큰 검증
 */
export const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, '리프레시 토큰이 필요합니다.', 400);
  }

  if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    return sendError(res, '유효하지 않은 리프레시 토큰입니다.', 400);
  }

  next();
};
