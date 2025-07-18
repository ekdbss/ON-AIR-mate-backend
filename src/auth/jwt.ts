/**
 * JWT 토큰 생성 및 검증 유틸리티
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// const JWT_EXPIRES_IN = '7d';

// export const generateToken = (user: { id: string; nickname: string }) => {
//   return jwt.sign(user, JWT_SECRET, {
//     expiresIn: JWT_EXPIRES_IN,
//   });
// };
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRES_IN = '1d';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export const generateAccessToken = (user: { id: string; nickname: string }) => {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

export const generateRefreshToken = (user: { id: string; nickname: string }) => {
  return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};
