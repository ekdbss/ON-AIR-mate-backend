import { Router } from 'express';
import * as collectionController from '../controllers/collectionController.js';
import {
  shareCollectionController,
  copyCollectionController,
} from '../controllers/collectionShareController.js';
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

/**
 * @swagger
 * /api/collections/{collectionId}:
 *   put:
 *     summary: 컬렉션 수정
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCollectionDto'
 *           example:
 *             title: "수정된 컬렉션 제목"
 *             description: "수정된 컬렉션 소개"
 *             visibility: "friends"
 *     responses:
 *       200:
 *         description: 컬렉션 수정 성공
 */
router.put('/:collectionId', requireAuth, collectionController.updateCollection);

/**
 * @swagger
 * /api/collections/{collectionId}:
 *   delete:
 *     summary: 컬렉션 삭제
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 컬렉션 삭제 성공
 */
router.delete('/:collectionId', requireAuth, collectionController.deleteCollection);

/**
 * @swagger
 * /api/collections/order:
 *   put:
 *     summary: 컬렉션 순서 변경
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReorderCollectionsDto'
 *           example:
 *             collectionOrders:
 *               - collectionId: 123
 *                 order: 1
 *               - collectionId: 124
 *                 order: 2
 *     responses:
 *       200:
 *         description: 컬렉션 순서 변경 성공
 */
router.put('/order', requireAuth, collectionController.updateCollectionOrder);

/**
 * 컬렉션 공유하기
 */
/**
 * @swagger
 * /api/collections/{collectionId}/share:
 *   post:
 *     summary: 컬렉션을 친구에게 공유
 *     description: 지정한 컬렉션을 여러 친구에게 공유합니다.
 *     tags:
 *       - Collections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 공유할 컬렉션 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *             required:
 *               - friendIds
 *             example:
 *               friendIds: [456, 789]
 *     responses:
 *       200:
 *         description: 컬렉션이 성공적으로 공유됨
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
 *                   example: "컬렉션이 공유되었습니다."
 *       400:
 *         description: '잘못된 요청 (예: friendIds 누락)'
 *       401:
 *         description: '인증 실패 (토큰 없음 또는 만료)'
 *       404:
 *         description: '컬렉션을 찾을 수 없음'
 *       500:
 *         description: '서버 내부 오류'
 */
router.post('/:collectionId/share', requireAuth, shareCollectionController);

/**
 * 친구 컬렉션 가져오기
 */
/**
 * @swagger
 * /api/collections/{collectionId}/copy:
 *   post:
 *     summary: 친구의 컬렉션을 내 라운지로 가져오기
 *     description: 친구가 공유한 컬렉션을 내 컬렉션 라운지로 복사합니다.
 *     tags:
 *       - Collections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 복사할 컬렉션 ID
 *     responses:
 *       200:
 *         description: 컬렉션 복사 성공
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
 *                       example: 125
 *                     message:
 *                       type: string
 *                       example: 컬렉션을 가져왔습니다.
 *       401:
 *         description: '인증 실패 (토큰 없음 또는 만료)'
 *       404:
 *         description: '컬렉션을 찾을 수 없음'
 *       500:
 *         description: '서버 내부 오류'
 */
router.post('/:collectionId/copy', requireAuth, copyCollectionController);

export default router;
