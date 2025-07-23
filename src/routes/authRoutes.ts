import express from 'express';
import {
  login,
  register,
  checkNickname,
  refreshToken,
  logout,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  validateLogin,
  validateRegister,
  validateNickname,
  validateRefreshToken,
} from '../middleware/authValidation.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 자체 로그인 (아이디/비밀번호 입력)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자 아이디
 *                 example: user1
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *                 example: secret123
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: 액세스 토큰
 *                       example: a1b2c3d4e5f6...
 *                     refreshToken:
 *                       type: string
 *                       description: 리프레시 토큰 (액세스 토큰과 동일)
 *                       example: a1b2c3d4e5f6...
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: number
 *                           example: 123
 *                         nickname:
 *                           type: string
 *                           example: 사용자닉네임
 *                         profileImage:
 *                           type: string
 *                           nullable: true
 *                           example: https://example.com/profile.jpg
 *                         popularity:
 *                           type: number
 *                           example: 85
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 입력하신 정보가 잘못되었습니다. 아이디와 비밀번호를 정확히 입력해주세요.
 */
router.post('/login', validateLogin, login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입 (계정 정보 생성)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - nickname
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자 아이디
 *                 example: user1
 *               password:
 *                 type: string
 *                 description: 비밀번호 (8~16자의 영문 대/소문자, 숫자, 특수문자)
 *                 example: Secret123!
 *               nickname:
 *                 type: string
 *                 description: 닉네임 (3~10자)
 *                 example: coolUser
 *               profileImage:
 *                 type: string
 *                 nullable: true
 *                 description: 프로필 이미지 URL
 *                 example: https://example.com/profile.jpg
 *               agreements:
 *                 type: object
 *                 description: 약관 동의 정보
 *                 properties:
 *                   serviceTerms:
 *                     type: boolean
 *                     description: 서비스 이용약관 동의 (필수)
 *                     example: true
 *                   privacyCollection:
 *                     type: boolean
 *                     description: 개인정보 수집 및 이용 동의 (필수)
 *                     example: true
 *                   privacyPolicy:
 *                     type: boolean
 *                     description: 개인정보 처리방침 동의 (필수)
 *                     example: true
 *                   marketingConsent:
 *                     type: boolean
 *                     description: 마케팅 수신 동의 (선택)
 *                     example: false
 *                   eventPromotion:
 *                     type: boolean
 *                     description: 이벤트/프로모션 참여 동의 (선택)
 *                     example: false
 *                   serviceNotification:
 *                     type: boolean
 *                     description: 서비스 알림 수신 동의
 *                     example: true
 *                   advertisementNotification:
 *                     type: boolean
 *                     description: 광고성 알림 수신 동의
 *                     example: false
 *                   nightNotification:
 *                     type: boolean
 *                     description: 야간 알림 수신 동의
 *                     example: true
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 회원가입이 완료되었습니다.
 *       409:
 *         description: 중복된 아이디 또는 닉네임
 */
router.post('/register', validateRegister, register);

/**
 * @swagger
 * /api/auth/check-nickname/{nickname}:
 *   get:
 *     summary: 닉네임 중복 확인
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: nickname
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 닉네임
 *         example: coolUser
 *     responses:
 *       200:
 *         description: 닉네임 중복 확인 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       description: 사용 가능 여부
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: 사용할 수 있는 닉네임입니다.
 */
router.get('/check-nickname/:nickname', validateNickname, checkNickname);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 액세스 토큰 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 리프레시 토큰
 *                 example: a1b2c3d4e5f6...
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: 새로운 액세스 토큰
 *                       example: x9y8z7w6v5u4...
 *       401:
 *         description: 유효하지 않은 리프레시 토큰
 */
router.post('/refresh', validateRefreshToken, refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 로그아웃되었습니다.
 *       401:
 *         description: 인증 실패
 */
router.post('/logout', requireAuth, logout);

export default router;
