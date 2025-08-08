import { Request, Response, NextFunction } from 'express';
import { CreateCollectionDto, CollectionVisibility } from '../dtos/collectionDto';
import * as collectionService from '../services/collectionService';
import AppError from '../middleware/errors/AppError';
import { sendSuccess } from '../utils/response';

export const createCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('AUTH_001', '인증되지 않은 사용자입니다.');
    }
    const userId = req.user.userId;
    const { title, description, visibility } = req.body as CreateCollectionDto;

    if (!title || !visibility) {
      throw new AppError('COLLECTION_005', '제목과 공개 범위는 필수입니다.');
    }

    if (!Object.values(CollectionVisibility).includes(visibility)) {
      throw new AppError('COLLECTION_006', '유효하지 않은 컬렉션 공개 범위 값입니다.');
    }

    const collectionData: CreateCollectionDto = { title, description, visibility };
    const collection = await collectionService.createCollection(userId, collectionData);

    sendSuccess(
      res,
      {
        collectionId: collection.collectionId,
        message: '컬렉션이 생성되었습니다.',
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};
