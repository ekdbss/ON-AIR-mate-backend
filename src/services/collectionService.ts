import { PrismaClient } from '@prisma/client';
import { CreateCollectionDto, GetCollectionDto } from '../dtos/collectionDto.js';
import AppError from '../middleware/errors/AppError.js';

const prisma = new PrismaClient();

export const createCollection = async (userId: number, collectionData: CreateCollectionDto) => {
  try {
    // 입력 데이터 검증
    if (!collectionData.title?.trim()) {
      throw new AppError('COLLECTION_005');
    }

    const collection = await prisma.collection.create({
      data: {
        userId,
        title: collectionData.title,
        description: collectionData.description || null,
        visibility: collectionData.visibility,
      },
    });

    return collection;
  } catch (error) {
    console.error('컬렉션 생성 오류:', error);
    throw error;
  }
};

export const getCollectionsByUserId = async (userId: number): Promise<GetCollectionDto[]> => {
  const collections = await prisma.collection.findMany({
    where: {
      userId: userId,
    },
  });

  return collections.map(collection => ({
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    bookmarkCount: collection.bookmarkCount,
    visibility: collection.visibility,
    coverImage: collection.coverImage,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  }));
};
