import express from 'express';
import { generateSummary, submitSummaryFeedback } from '../controllers/aiSummaryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/ai/summary:
 *   post:
 *     summary: 방 종료 시 채팅 요약 생성
 *     tags: [AI Summary]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *             properties:
 *               roomId:
 *                 type: number
 *                 description: 요약할 방의 ID
 *                 example: 123
 *     responses:
 *       201:
 *         description: 채팅 요약 생성 성공
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
 *                     summaryId:
 *                       type: string
 *                       example: summary_123
 *                     roomTitle:
 *                       type: string
 *                       example: 방제목
 *                     videoTitle:
 *                       type: string
 *                       example: 영상제목
 *                     topicSummary:
 *                       type: string
 *                       example: 전체 대화 주제 요약
 *                     emotionAnalysis:
 *                       type: array
 *                       description: 감정별 분석 결과
 *                       example:
 *                         - emotion: "기쁨"
 *                           percentage: 40
 *                         - emotion: "공감"
 *                           percentage: 30
 *                         - emotion: "놀람"
 *                           percentage: 20
 *                         - emotion: "슬픔"
 *                           percentage: 10
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-01-27T12:00:00Z
 *       404:
 *         description: 방을 찾을 수 없음
 *       403:
 *         description: 방에 참여하지 않은 사용자
 */
router.post('/summary', requireAuth, generateSummary);

/**
 * @swagger
 * /api/ai/summary/{summaryId}/feedback:
 *   post:
 *     summary: AI 요약에 대한 피드백 제출
 *     tags: [AI Summary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: summaryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 요약 ID
 *         example: summary_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: string
 *                 enum: [LIKE, DISLIKE]
 *                 description: 피드백 타입
 *                 example: LIKE
 *               comment:
 *                 type: string
 *                 description: 피드백 코멘트
 *                 example: 피드백 코멘트
 *     responses:
 *       200:
 *         description: 피드백 제출 성공
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
 *                       example: 피드백이 제출되었습니다.
 */
router.post('/summary/:summaryId/feedback', requireAuth, submitSummaryFeedback);

export default router;
