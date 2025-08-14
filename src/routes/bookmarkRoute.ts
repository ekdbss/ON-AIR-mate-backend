import express from 'express';
import {
  createBookmark,
  getBookmarks,
  deleteBookmark,
  moveBookmarkToCollection,
  createRoomFromBookmark,
} from '../controllers/bookmarkController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: 북마크 관련 API
 */

/**
 * @swagger
 * /api/bookmarks:
 *   post:
 *     summary: 북마크 생성
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: number
 *                 example: 2
 *               message:
 *                 type: string
 *                 example: "00:03:45 제 최애 파트!"
 *                 description: |
 *                   북마크 메시지는 `MM:SS 내용` 또는 `HH:MM:SS 내용` 형식으로 작성해야 합니다.
 *                   - 예: "12:34 삼구삼진", "01:02:30 병살 가자"
 *                   - 앞의 시간은 북마크 타임라인으로, 뒤는 내용으로 저장됩니다.
 *             required:
 *               - roomId
 *               - message
 *     responses:
 *       200:
 *         description: 북마크 생성 성공
 *       400:
 *         description: 잘못된 형식의 메시지
 *       401:
 *         description: 인증 실패
 */

// 1. 북마크 생성
router.post('/', requireAuth, createBookmark);

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     summary: 북마크 목록 조회
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: collectionId
 *         schema:
 *           type: number
 *         required: false
 *         description: 특정 컬렉션의 북마크만 조회
 *       - in: query
 *         name: uncategorized
 *         schema:
 *           type: boolean
 *         required: false
 *         description: 컬렉션 미지정 북마크만 조회
 *     responses:
 *       200:
 *         description: 북마크 목록 조회 성공
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
 *                     uncategorized:
 *                       type: array
 *                       description: 컬렉션에 속하지 않은 북마크 그룹
 *                       items:
 *                         type: object
 *                         properties:
 *                           roomData:
 *                             type: object
 *                             properties:
 *                               roomId:
 *                                 type: number
 *                                 example: 333
 *                               roomName:
 *                                 type: string
 *                                 example: "방이름1"
 *                               videoTitle:
 *                                 type: string
 *                                 example: "영상제목"
 *                               videoThumbnail:
 *                                 type: string
 *                                 example: "https://img.youtube.com/vi/abc123xyz/mqdefault.jpg"
 *                               collectionTitle:
 *                                 type: string
 *                                 nullable: true
 *                                 example: null
 *                           bookmarks:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 bookmarkId:
 *                                   type: number
 *                                   example: 456
 *                                 message:
 *                                   type: string
 *                                   example: "00:15:30 재밌는 장면"
 *                                 timeline:
 *                                   type: number
 *                                   example: 930
 *                     all:
 *                       type: array
 *                       description: 모든 북마크 그룹 (컬렉션 포함 + 미분류 포함)
 *                       items:
 *                         type: object
 *                         properties:
 *                           roomData:
 *                             type: object
 *                             properties:
 *                               roomId:
 *                                 type: number
 *                                 example: 393
 *                               roomName:
 *                                 type: string
 *                                 example: "방이름2"
 *                               videoTitle:
 *                                 type: string
 *                                 example: "영상제목"
 *                               videoThumbnail:
 *                                 type: string
 *                                 example: "https://img.youtube.com/vi/def456uvw/mqdefault.jpg"
 *                               collectionTitle:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "내가 좋아하는 영상들"
 *                           bookmarks:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 bookmarkId:
 *                                   type: number
 *                                   example: 457
 *                                 message:
 *                                   type: string
 *                                   example: "00:20:15 명장면"
 *                                 timeline:
 *                                   type: number
 *                                   example: 1215
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2025-01-01T12:30:00Z"
 *       401:
 *         description: 인증 실패
 */

// 2. 북마크 목록 조회
router.get('/', requireAuth, getBookmarks);

/**
 * @swagger
 * /api/bookmarks/{bookmarkId}:
 *   delete:
 *     summary: 북마크 삭제
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookmarkId
 *         required: true
 *         schema:
 *           type: number
 *         description: 삭제할 북마크 ID
 *     responses:
 *       200:
 *         description: 북마크 삭제 성공
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 북마크를 찾을 수 없음
 */
// 3. 북마크 삭제
router.delete('/:bookmarkId', requireAuth, deleteBookmark);

/**
 * @swagger
 * /api/bookmarks/{bookmarkId}/collection:
 *   put:
 *     summary: 북마크 컬렉션 이동
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookmarkId
 *         required: true
 *         schema:
 *           type: number
 *         description: 이동할 북마크 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionId:
 *                 type: number
 *             required:
 *               - collectionId
 *     responses:
 *       200:
 *         description: 컬렉션 이동 성공
 *       401:
 *         description: 인증 실패
 */
// 4. 북마크 컬렉션 이동
router.put('/:bookmarkId/collection', requireAuth, moveBookmarkToCollection);

/**
 * @swagger
 * /api/bookmarks/{bookmarkId}/create-room:
 *   post:
 *     summary: 북마크를 기반으로 방 생성
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookmarkId
 *         required: true
 *         schema:
 *           type: number
 *         description: 기준이 되는 북마크 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomTitle:
 *                 type: string
 *               maxParticipants:
 *                 type: number
 *               isPrivate:
 *                 type: boolean
 *               startFrom:
 *                 type: string
 *                 enum: [BOOKMARK, BEGINNING]
 *             required:
 *               - roomTitle
 *               - maxParticipants
 *               - isPrivate
 *               - startFrom
 *     responses:
 *       200:
 *         description: 방 생성 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
// 5. 북마크로 방 생성
router.post('/:bookmarkId/create-room', requireAuth, createRoomFromBookmark);

export default router;
