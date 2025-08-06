import { Request, Response } from 'express';
import { RecommendationService } from '../services/userRecommendationService.js';

const recommendationService = new RecommendationService();

// 1. 일일 추천하기 API (POST /api/recommendations/daily)
export const createDailyRecommendation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    return;
  }

  const { targetUserId } = req.body;

  try {
    const result = await recommendationService.createDailyRecommendation(userId, { targetUserId });
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, message: err.message });
    } else {
      res.status(400).json({
        success: false,
        message: '사용자 추천 API 호출 중 알 수 없는 오류가 발생했습니다.',
      });
    }
  }
};

// 2. 추천 가능 여부 확인 API (GET /api/recommendations/daily/:userId)
export const checkDailyRecommendation = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    return;
  }

  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) {
    res.status(400).json({ success: false, message: '잘못된 사용자 ID입니다.' });
    return;
  }

  try {
    const result = await recommendationService.checkDailyRecommendation(userId, targetUserId);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, message: err.message });
    } else {
      res.status(400).json({
        success: false,
        message: '추천 가능 여부 확인 중 알 수 없는 오류가 발생했습니다.',
      });
    }
  }
};
