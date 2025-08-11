import { Request, Response, NextFunction } from 'express';
import { CreateCollectionDto } from '../dtos/collectionDto.js';
import * as collectionService from '../services/collectionService.js';
import AppError from '../middleware/errors/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { CollectionVisibility } from '@prisma/client';

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

export const getCollections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('AUTH_001', '인증되지 않은 사용자입니다.');
    }
    const userId = req.user.userId;
    const collections = await collectionService.getCollectionsByUserId(userId);
    sendSuccess(res, { collections });
  } catch (error) {
    next(error);
  }
};

export const getCollectionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('AUTH_001', '인증되지 않은 사용자입니다.');
    }
    const userId = req.user.userId;
    const collectionId = parseInt(req.params.collectionId, 10);

    if (isNaN(collectionId)) {
      throw new AppError('COLLECTION_004', '유효하지 않은 컬렉션 ID입니다.');
    }

    const collectionDetail = await collectionService.getCollectionDetailById(collectionId, userId);
    sendSuccess(res, collectionDetail);
  } catch (error) {
    next(error);
  }
};
