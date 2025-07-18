import express from 'express';
import { login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginId:
 *                 type: string
 *                 example: user1
 *               password:
 *                 type: string
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
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR...
 *                 error:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: 인증 실패
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 사용자 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginId:
 *                 type: string
 *                 example: user1
 *               password:
 *                 type: string
 *                 example: secret123
 *               nickname:
 *                 type: string
 *                 example: coolUser
 *               profileImage:
 *                 type: string
 *                 example: https://example.com/image.png
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
 *                     id:
 *                       type: string
 *                       example: 1234abcd
 *                 error:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: 회원가입 실패 (중복 등)
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 헤더 토큰으로 로그인 유저 정보 반환
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: JWT 토큰에 포함된 유저 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   example:
 *                     id: 123
 *                     email: user@example.com
 *                     role: user
 *       401:
 *         description: 인증 실패 (토큰 누락 또는 유효하지 않음)
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user, // 토큰에서 추출된 유저 정보
  });
});
export default router;
