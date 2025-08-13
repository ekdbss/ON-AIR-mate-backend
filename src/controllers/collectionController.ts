import { Request, Response, NextFunction } from 'express';
import { CreateCollectionDto } from '../dtos/collectionDto.js';
import * as collectionService from '../services/collectionService.js';
import AppError from '../middleware/errors/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { CollectionVisibility } from '@prisma/client';

// 1. 컬랙션 생성
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

// 2. 컬랙션 목록 조회
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

// 3. 컬랙션 상세 조회
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

// 4. 컬렉션 수정
export const updateCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('AUTH_001', '인증되지 않은 사용자입니다.');

    const collectionId = parseInt(req.params.collectionId, 10);
    if (isNaN(collectionId)) throw new AppError('COLLECTION_004', '유효하지 않은 컬렉션 ID입니다.');

    const { title, description, visibility } = req.body;

    if (visibility && !Object.values(CollectionVisibility).includes(visibility)) {
      throw new AppError('COLLECTION_006', '유효하지 않은 컬렉션 공개 범위 값입니다.');
    }

    await collectionService.updateCollection(collectionId, req.user.userId, {
      title,
      description,
      visibility,
    });

    sendSuccess(res, { message: '컬렉션이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 5. 컬렉션 삭제
export const deleteCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('AUTH_001', '인증되지 않은 사용자입니다.');

    const collectionId = parseInt(req.params.collectionId, 10);
    if (isNaN(collectionId)) throw new AppError('COLLECTION_004', '유효하지 않은 컬렉션 ID입니다.');

    await collectionService.deleteCollection(collectionId, req.user.userId);

    sendSuccess(res, { message: '컬렉션이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 6. 컬렉션 순서 변경
export const updateCollectionOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('AUTH_001', '인증되지 않은 사용자입니다.');

    const { collectionOrders } = req.body;
    if (!Array.isArray(collectionOrders)) {
      throw new AppError('COLLECTION_007', '컬렉션 순서 데이터가 올바르지 않습니다.');
    }

    await collectionService.updateCollectionOrder(req.user.userId, collectionOrders);

    sendSuccess(res, { message: '컬렉션 순서가 변경되었습니다.' });
  } catch (error) {
    next(error);
  }
};
