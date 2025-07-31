import { Request, Response, NextFunction } from 'express';
import * as roomSettingService from '../services/roomSettingService.js';
import { UpdateRoomSettingDto } from '../dtos/roomSettingDto.js';
import AppError from '../middleware/errors/AppError.js';

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
      return next(new AppError('인증이 필요합니다.'));
    }

    await roomSettingService.updateRoomSettings(roomId, userId, updateDto);

    res.status(200).json({
      success: true,
      message: '방 설정이 수정되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};
