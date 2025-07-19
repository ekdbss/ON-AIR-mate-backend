import { Router } from 'express';
import { recommendVideos } from '../controllers/recommendationController.js';

const router = Router();

/**
 * @swagger
 * /api/youtube/recommendations:
 *   get:
 *     summary: 검색어 기반 추천 영상 조회
 *     tags: [YouTube]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: 검색할 키워드
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: 가져올 영상의 최대 개수 (1-50)
 *     responses:
 *       200:
 *         description: 추천 영상 목록
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationResponse'
 *       400:
 *         description: 잘못된 요청 (키워드 누락 또는 limit 파라미터 오류)
 */
router.get('/recommendations', recommendVideos);

export default router;
