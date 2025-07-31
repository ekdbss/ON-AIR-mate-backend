import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';
import * as youtubeService from '../services/youtubeRecommendationService.js';

export const recommendVideos = async (req: Request, res: Response, next: NextFunction) => {
  const keyword = req.query.keyword as string;
  const limit = req.query.limit as string;

  if (!keyword || typeof keyword !== 'string') {
    return next(new AppError('SEARCH_001')); // '검색어를 입력해주세요.'
  }

  const parsedLimit = limit ? parseInt(limit, 10) : 3;
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
    return next(new AppError('GENERAL_001', 'limit 파라미터는 1과 50 사이의 숫자여야 합니다.'));
  }

  try {
    const videos = await youtubeService.getRecommendedVideos(keyword, parsedLimit);
    sendSuccess(res, videos);
  } catch (error) {
    if (error instanceof Error) {
      return next(new AppError('GENERAL_004', error.message));
    } else {
      next(new AppError('GENERAL_004'));
    }
  }
};
