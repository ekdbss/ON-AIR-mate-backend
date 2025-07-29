import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import * as userService from '../services/userServices.js';
import AppError from '../middleware/errors/AppError.js';

// 프로필 정보 조회
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const profile = await userService.getUserProfile(userId);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

// 프로필 정보 수정
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { nickname, profileImage } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    // 원본: if (!nickname && profileImage === undefined) {
    if (!nickname && !profileImage) {
      throw new AppError('USER_004');
    }

    await userService.updateUserProfile(userId, { nickname, profileImage });
    sendSuccess(res, { message: '프로필이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 알림 설정 조회
export const getNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const settings = await userService.getNotificationSettings(userId);
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

// 알림 설정 수정
export const updateNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    const { serviceNotification, advertisementNotification, nightNotification } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (
      serviceNotification === undefined &&
      advertisementNotification === undefined &&
      nightNotification === undefined
    ) {
      throw new AppError('USER_004');
    }

    await userService.updateNotificationSettings(userId, {
      serviceNotification,
      advertisementNotification,
      nightNotification,
    });

    sendSuccess(res, { message: '알림 설정이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 참여한 방 목록 조회
export const getParticipatedRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const rooms = await userService.getParticipatedRooms(userId);
    sendSuccess(res, rooms);
  } catch (error) {
    next(error);
  }
};

// 검색 기록 조회
export const getSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const history = await userService.getSearchHistory(userId);
    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

// 의견 보내기
export const sendFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (!content || content.trim().length === 0) {
      throw new AppError('USER_005');
    }

    await userService.sendUserFeedback(userId, content);
    sendSuccess(res, { message: '의견을 보냈습니다. 소중한 의견 감사합니다.' });
  } catch (error) {
    next(error);
  }
};
