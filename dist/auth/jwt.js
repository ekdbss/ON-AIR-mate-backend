/**
 * JWT 토큰 생성 및 검증 유틸리티
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '7d';
export const generateToken = (user) => {
    return jwt.sign(user, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};
