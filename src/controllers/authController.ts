import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { createUser, findUserByNickname, findUserByLoginId } from '../services/authServices';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { loginId, password, nickname, profileImage } = req.body;

    const checkNickname = await findUserByNickname(nickname);
    if (checkNickname) return sendError(res, '이미 존재하는 닉네임입니다.', 409);

    const existingUser = await findUserByLoginId(loginId);
    if (existingUser) return sendError(res, '이미 존재하는 아이디입니다.', 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({ loginId, password: hashedPassword, nickname, profileImage });

    sendSuccess(res, { user: { id: newUser.userId, loginId, nickname } }, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { loginId, password } = req.body;

    const user = await findUserByLoginId(loginId);
    if (!user) return sendError(res, '존재하는 유저 아이디가 아닙니다.', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendError(res, '아이디 또는 비밀번호가 일치하지 않습니다.', 401);

    //const token = generateToken({ id: user.loginId, nickname: user.nickname });
    const accessToken = generateAccessToken({ id: user.loginId, nickname: user.nickname });
    const refreshToken = generateRefreshToken({ id: user.loginId, nickname: user.nickname });

    sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.userId,
        loginId: user.loginId,
        nickname: user.nickname,
        popularity: user.popularity,
      },
    });
  } catch (err) {
    next(err);
  }
};
