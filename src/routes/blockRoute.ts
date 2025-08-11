import express from 'express';
import { makeBlock, getBlocks, deleteBlock } from '../controllers/blockController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/blocks:
 *   post:
 *     summary: 사용자 차단 생성
 *     tags:
 *       - Block
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: 차단 대상과 이유
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - reasons
 *             properties:
 *               targetUserId:
 *                 type: integer
 *                 example: 456
 *               reasons:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [SPAM, SPOIL, PROFANITY, HATE, ETC]
 *                 example: ["SPAM", "SPOIL"]
 *               additionalReason:
 *                 type: string
 *                 example: "추가 차단 사유"
 *     responses:
 *       200:
 *         description: 사용자 차단 성공 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "사용자가 차단되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
router.post('/', requireAuth, makeBlock);
/**
 * @swagger
 * /api/blocks:
 *   get:
 *     summary: 사용자가 차단한 사용자 목록 조회
 *     tags:
 *       - Block
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 차단 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       blockId:
 *                         type: integer
 *                         example: 123
 *                       userId:
 *                         type: integer
 *                         example: 456
 *                       nickname:
 *                         type: string
 *                         example: "차단된닉네임"
 *                       profileImage:
 *                         type: string
 *                         example: "프로필이미지URL"
 *                       reason:
 *                         type: string
 *                         example: "SPAM"
 *                       blockedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-01T12:00:00Z"
 *       401:
 *         description: 인증 실패
 */
router.get('/', requireAuth, getBlocks);
/**
 * @swagger
 * /api/blocks/{blockId}:
 *   delete:
 *     summary: 차단 해제
 *     tags:
 *       - Block
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: blockId
 *         in: path
 *         description: 차단 ID
 *         required: true
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       200:
 *         description: 차단 해제 성공 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "차단이 해제되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 차단 정보 없음
 */
router.delete('/:blockId', requireAuth, deleteBlock);

export default router;
