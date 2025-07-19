var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { createUser, findUserByNickname, findUserByLoginId } from '../services/authServices';

export const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { loginId, password, nickname, profileImage } = req.body;
        const checkNickname = yield findUserByNickname(nickname);
        if (checkNickname)
            return sendError(res, '이미 존재하는 닉네임입니다.', 409);
        const existingUser = yield findUserByLoginId(loginId);
        if (existingUser)
            return sendError(res, '이미 존재하는 아이디입니다.', 409);
        const hashedPassword = yield bcrypt.hash(password, 10);
        const newUser = yield createUser({ loginId, password: hashedPassword, nickname, profileImage });
        sendSuccess(res, { user: { id: newUser.userId, loginId, nickname } }, 201);
    }
    catch (err) {
        next(err);
    }
});
export const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { loginId, password } = req.body;
        const user = yield findUserByLoginId(loginId);
        if (!user)
            return sendError(res, '존재하는 유저 아이디가 아닙니다.', 401);
        const isMatch = yield bcrypt.compare(password, user.password);
        if (!isMatch)
            return sendError(res, '아이디 또는 비밀번호가 일치하지 않습니다.', 401);
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
    }
    catch (err) {
        next(err);
    }
});
