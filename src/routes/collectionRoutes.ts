import { Router } from 'express';
import * as collectionController from '../controllers/collectionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: 새로운 컬렉션 생성
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCollectionDto'
 *     responses:
 *       201:
 *         description: 컬렉션 생성 성공
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
 *                     collectionId:
 *                       type: integer
 *                       example: 123
 *                     message:
 *                       type: string
 *                       example: "컬렉션이 생성되었습니다."
 *       400:
 *         description: 잘못된 요청 데이터
 *       401:
 *         description: 인증되지 않은 사용자
 */
router.post('/', requireAuth, collectionController.createCollection);

export default router;
