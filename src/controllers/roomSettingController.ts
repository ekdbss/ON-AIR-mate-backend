import { Request, Response, NextFunction } from 'express';
import * as roomSettingService from '../services/roomSettingService.js';
import { UpdateRoomSettingDto } from '../dtos/roomSettingDto.js';
import AppError from '../middleware/errors/AppError.js';
import { sendSuccess } from '../utils/response.js';

// 방 설정 조회
export const getRoomSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new AppError('AUTH_007', '인증이 필요합니다.'));
    }

    const settings = await roomSettingService.getRoomSettings(roomId, userId);
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

// 방 설정 수정
export const updateRoomSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;
    const updateDto: UpdateRoomSettingDto = req.body;

    if (!userId) {
      return next(new AppError('AUTH_007', '인증이 필요합니다.'));
    }

    await roomSettingService.updateRoomSettings(roomId, userId, updateDto);

    sendSuccess(res, { message: '방 설정이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};
