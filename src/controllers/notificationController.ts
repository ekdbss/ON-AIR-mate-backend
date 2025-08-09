import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';
import {
  getRecentNotis,
  countUnreadNotifications,
  markNotificationAsRead,
} from '../services/notificationService.js';

export const getRecentNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; // JWT에서 유저 ID 추출
    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const result = await getRecentNotis(userId);
    sendSuccess(res, result);
  } catch (error) {
    console.error('알림 조회 오류:', error);
    next(error);
  }
};

export const getUnReadNotificationNum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; // JWT에서 유저 ID 추출
    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const result = await countUnreadNotifications(userId);

    sendSuccess(res, { unreadCount: result });
  } catch (error) {
    console.error('안 읽은 알림 개수 조회 오류:', error);
    next(error);
  }
};

export const setReadNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; // JWT에서 유저 ID 추출
    if (!userId) {
      throw new AppError('AUTH_007');
    }

    await markNotificationAsRead(userId);

    sendSuccess(res, { messages: '모든 알림이 읽음 처리되었습니다.' });
  } catch (error) {
    console.error('안 읽은 알림 개수 조회 오류:', error);
    next(error);
  }
};
