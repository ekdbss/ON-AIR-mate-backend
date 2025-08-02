import { Request, Response, NextFunction } from 'express';
import { roomInfoService } from '../services/roomInfoService.js';
import AppError from '../middleware/errors/AppError.js';
import { sendSuccess } from '../utils/response.js';

const getRoomInfo = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[Controller] getRoomInfo called');
  try {
    const { roomId: roomIdStr } = req.params;
    const roomId = parseInt(roomIdStr, 10);

    if (isNaN(roomId)) {
      return next(new AppError('VALIDATION_001', '유효하지 않은 방 ID입니다.'));
    }

    const roomInfo = await roomInfoService.getRoomInfoById(roomId);

    sendSuccess(res, roomInfo);
  } catch (error) {
    next(error);
  }
};

export const roomInfoController = {
  getRoomInfo,
};
