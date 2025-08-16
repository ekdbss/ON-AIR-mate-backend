import { Router } from 'express';
import {
  createDailyRecommendation,
  checkDailyRecommendation,
} from '../controllers/userRecommendationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /api/recommendations/daily:
 *   post:
 *     summary: 하루에 한 번 다른 사용자 추천하기
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetUserId:
 *                 type: integer
 *                 example: 456
 *     responses:
 *       200:
 *         description: 추천 성공 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: 추천을 보냈습니다.
 *       400:
 *         description: 에러 메시지
 */
// 1. 일일 추천하기 API (POST /api/recommendations/daily)
router.post('/daily', requireAuth, createDailyRecommendation);

/**
 * @swagger
 * /api/recommendations/daily/{userId}:
 *   get:
 *     summary: 특정 사용자에 대해 오늘 추천 가능한지 확인
 *     tags: [Recommendation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 추천 대상 사용자 ID
 *     responses:
 *       200:
 *         description: 추천 가능 여부 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     canRecommend:
 *                       type: boolean
 *                       example: true
 *                     lastRecommendedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true   # <-- 추가
 *                       example: null
 *       400:
 *         description: 에러 메시지
 */
// 2. 추천 가능 여부 확인 API (GET /api/recommendations/daily/:userId)
router.get('/daily/:userId', requireAuth, checkDailyRecommendation);

export default router;
