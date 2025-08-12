import { Request, Response, NextFunction } from 'express';
import { shareCollectionService, copyCollectionService } from '../services/shareCollectionService';
import AppError from '../middleware/errors/AppError.js';
import { sendSuccess } from '../utils/response.js';
interface ShareCollectionBody {
  friendIds: (string | number)[];
}

export const shareCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId; // JWT 등 인증 미들웨어에서 넣어준 userId
    const { friendIds } = req.body as ShareCollectionBody;
    const { collectionId: collectionIdParam } = req.params;

    console.log('collectionIdParam:', collectionIdParam);
    const collectionId = parseInt(collectionIdParam, 10);
    console.log('parsed collectionId:', collectionId);
    if (isNaN(collectionId)) {
      return next(new AppError('VALIDATION_001', '유효하지 않은 컬렉션 ID입니다.'));
    }

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    // friendIds 유효성 검사 및 정수화
    const receiverIds: number[] = Array.isArray(friendIds)
      ? [...new Set(friendIds.map(id => Number(id)))]
      : [];

    if (!receiverIds.length || receiverIds.some(id => !Number.isInteger(id) || id <= 0)) {
      throw new AppError('VALIDATION_001', '유효하지 않은 친구 ID 목록입니다.');
    }

    if (receiverIds.includes(userId)) {
      throw new AppError('VALIDATION_001', '본인에게는 공유할 수 없습니다.');
    }

    // 서비스 호출
    const results = await shareCollectionService(userId, receiverIds, collectionId);
    console.log('컬렉션 공유 완료:', results);

    sendSuccess(res, { message: '친구에게 컬렉션을 공유했습니다.' }, 201);
  } catch (err) {
    console.error('컬렉션 공유 API 에러:', err);
    next(err);
  }
};

export const copyCollectionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; // JWT 등 인증 미들웨어에서 넣어준 userId
    const { collectionId: collectionIdParam } = req.params;

    console.log('collectionIdParam:', collectionIdParam);
    const collectionId = parseInt(collectionIdParam, 10);
    console.log('parsed collectionId:', collectionId);
    if (isNaN(collectionId)) {
      return next(new AppError('VALIDATION_001', '유효하지 않은 컬렉션 ID입니다.'));
    }

    if (isNaN(collectionId)) {
      throw new AppError('GENERAL_001', '유효하지 않은 컬렉션입니다.');
    }

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    // 서비스 호출
    const result = await copyCollectionService(userId, collectionId);
    console.log('컬렉션 가져오기 완료:', result);

    sendSuccess(res, { message: '친구 컬렉션을 가져왔습니다.' }, 201);
  } catch (err) {
    console.error('컬렉션 가져오기 API 에러:', err);
    next(err);
  }
};
