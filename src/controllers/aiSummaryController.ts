import { Request, Response, NextFunction } from 'express';
import { aiSummaryService } from '../services/aiSummaryService.js';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';

// 타입 가드 함수
function isFeedbackType(value: unknown): value is 'LIKE' | 'DISLIKE' {
  return value === 'LIKE' || value === 'DISLIKE';
}

/**
 * 방 종료 시 채팅 요약 생성
 * POST /ai/summary
 */
export const generateSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { roomId } = req.body as { roomId: number };
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007', '인증이 필요합니다.');
    }

    if (!roomId || typeof roomId !== 'number') {
      throw new AppError('GENERAL_001', 'roomId는 필수이며 숫자여야 합니다.');
    }

    const summary = await aiSummaryService.generateChatSummary({ roomId }, userId);

    sendSuccess(res, summary, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * AI 요약에 대한 피드백 제출
 * POST /ai/summary/:summaryId/feedback
 */
export const submitSummaryFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { summaryId } = req.params;
    const { feedback, comment } = req.body as { feedback: unknown; comment?: string };
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007', '인증이 필요합니다.');
    }

    if (!summaryId) {
      throw new AppError('GENERAL_001', 'summaryId는 필수입니다.');
    }

    if (!feedback || !isFeedbackType(feedback)) {
      throw new AppError('GENERAL_001', 'feedback은 LIKE 또는 DISLIKE여야 합니다.');
    }

    await aiSummaryService.submitFeedback(summaryId, userId, feedback, comment);

    sendSuccess(res, {
      message: '피드백이 제출되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};
