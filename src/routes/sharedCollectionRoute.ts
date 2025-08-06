import { Router } from 'express';
import {
  getReceivedCollections,
  respondToSharedCollection,
} from '../controllers/sharedCollectionController.js';
import { requireAuth } from '../middleware/authMiddleware.js'; // 인증 미들웨어 경로에 맞게 수정 필요

const router = Router();
/**
 * @swagger
 * tags:
 *   name: SharedCollections
 *   description: 공유받은 컬렉션 관련 API
 */

/**
 * @swagger
 * /api/shared-collections:
 *   get:
 *     summary: 공유받은 컬렉션 목록 조회
 *     description: 로그인한 사용자가 공유받은 컬렉션 목록을 조회합니다.
 *     tags: [SharedCollections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 공유받은 컬렉션 목록 조회 성공
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
 *                       sharedCollectionId:
 *                         type: integer
 *                         example: 5
 *                       originalCollectionId:
 *                         type: integer
 *                         example: 12
 *                       title:
 *                         type: string
 *                         example: 공유받은 컬렉션 by nickname1
 *                       fromUserId:
 *                         type: integer
 *                         example: 3
 *                       fromUserNickname:
 *                         type: string
 *                         example: nickname1
 *                       bookmarkCount:
 *                         type: integer
 *                         example: 7
 *                       sharedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-07-30T14:48:00.000Z
 */
// 1. 공유받은 컬렉션 목록 조회 (GET /api/shared-collections)
router.get('/', requireAuth, getReceivedCollections);

/**
 * @swagger
 * /api/shared-collections/{sharedCollectionId}:
 *   put:
 *     summary: 공유받은 컬렉션 수락 또는 거절
 *     description: 공유받은 컬렉션을 수락하거나 거절합니다.
 *     tags: [SharedCollections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sharedCollectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 공유받은 컬렉션의 ID (share_id 필드)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ACCEPT, REJECT]
 *                 example: ACCEPT
 *     responses:
 *       200:
 *         description: 공유 컬렉션 수락 또는 거절 성공
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
 *                   example: 컬렉션을 수락했습니다.
 */
// 2. 공유 컬렉션 수락/거절 (PUT /api/shared-collections/:sharedCollectionId)
router.put('/:sharedCollectionId', requireAuth, respondToSharedCollection);

export default router;
