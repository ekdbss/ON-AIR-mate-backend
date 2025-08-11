import { PrismaClient } from '@prisma/client';
import {
  CreateCollectionDto,
  GetCollectionDto,
  GetCollectionDetailDto,
} from '../dtos/collectionDto.js';
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

export const getCollectionDetailById = async (
  collectionId: number,
  userId: number,
): Promise<GetCollectionDetailDto> => {
  const collection = await prisma.collection.findUnique({
    where: { collectionId },
    include: {
      bookmarks: {
        include: {
          room: {
            include: {
              video: true,
            },
          },
        },
      },
    },
  });

  if (!collection) {
    throw new AppError('COLLECTION_001', '컬렉션을 찾을 수 없습니다.');
  }

  // 접근 권한 확인
  if (collection.userId !== userId) {
    if (collection.visibility === 'private') {
      throw new AppError('COLLECTION_003', '비공개 컬렉션에 접근할 권한이 없습니다.');
    }

    if (collection.visibility === 'friends') {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requestedBy: userId, requestedTo: collection.userId, status: 'accepted' },
            { requestedBy: collection.userId, requestedTo: userId, status: 'accepted' },
          ],
        },
      });

      if (!friendship) {
        throw new AppError('COLLECTION_002', '친구에게만 공개된 컬렉션입니다.');
      }
    }
  }

  return {
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    bookmarkCount: collection.bookmarkCount,
    visibility: collection.visibility,
    coverImage: collection.coverImage,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    bookmarks: collection.bookmarks.map(bookmark => ({
      bookmarkId: bookmark.bookmarkId,
      videoTitle: bookmark.room.video.title,
      videoThumbnail: bookmark.room.video.thumbnail || '',
      roomTitle: bookmark.room.roomName,
      message: `${String(Math.floor(bookmark.timeline! / 60)).padStart(2, '0')}:${String(bookmark.timeline! % 60).padStart(2, '0')} ${bookmark.content}`,
      createdAt: bookmark.createdAt,
    })),
  };
};
