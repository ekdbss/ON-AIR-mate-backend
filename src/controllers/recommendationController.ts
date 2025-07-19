import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';
import * as youtubeService from '../services/recommendationService.js';

export const recommendVideos = async (req: Request, res: Response, next: NextFunction) => {
  const { keyword, limit } = req.query;

  if (!keyword || typeof keyword !== 'string') {
    return next(new AppError(400, '검색어를 입력해주세요.'));
  }

  const parsedLimit = limit ? parseInt(limit as string, 10) : 3;
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
    return next(new AppError(400, 'limit 파라미터는 1과 50 사이의 숫자여야 합니다.'));
  }

  try {
    const videos = await youtubeService.getRecommendedVideos(keyword as string, parsedLimit);
    sendSuccess(res, videos);
  } catch (error) {
    if (error instanceof Error) {
      return next(new AppError(500, error.message));
    } else {
      next(new AppError(500, '알 수 없는 오류가 발생했습니다.'));
    }
  }
};
