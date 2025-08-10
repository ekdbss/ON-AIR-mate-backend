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

/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: 사용자의 컬렉션 목록 조회
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 컬렉션 목록 조회 성공
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
 *                     $ref: '#/components/schemas/GetCollectionDto'
 */
router.get('/', requireAuth, collectionController.getCollections);

/**
 * @swagger
 * /api/collections/{collectionId}:
 *   get:
 *     summary: 특정 컬렉션의 상세 정보 및 북마크 조회
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 컬렉션 ID
 *     responses:
 *       200:
 *         description: 컬렉션 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetCollectionDetailDto'
 *       401:
 *         description: 인증되지 않은 사용자 또는 권한 없음
 *       404:
 *         description: 컬렉션을 찾을 수 없음
 */
router.get('/:collectionId', requireAuth, collectionController.getCollectionDetail);

export default router;
