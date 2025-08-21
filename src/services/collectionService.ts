import { prisma } from '../lib/prisma.js';
import { CollectionVisibility } from '@prisma/client';
import { CreateCollectionDto, GetCollectionDto } from '../dtos/collectionDto.js';
import AppError from '../middleware/errors/AppError.js';

// 1. 컬랙션 생성
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

// 2. 컬랙션 목록 조회
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

// 3. 컬랙션 상세 조회
export const getCollectionDetailById = async (collectionId: number, userId: number) => {
  let collection = await prisma.collection.findUnique({
    where: { collectionId },
    include: {
      bookmarks: {
        include: {
          room: {
            include: {
              youtube_videos: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!collection) {
    throw new AppError('COLLECTION_001', '컬렉션을 찾을 수 없습니다.');
  }

  //북마크가 있는데도 커버이미지가 없는 경우 자동 추가
  if (collection.bookmarkCount > 0 && !collection.coverImage) {
    // 첫 번째 북마크 찾기 (가장 오래된 북마크 1개만)
    const firstBookmark = await prisma.bookmark.findFirst({
      where: { collectionId: collection.collectionId },
      orderBy: { createdAt: 'asc' },
      include: {
        room: {
          include: {
            youtube_videos: {
              select: { thumbnail: true },
            },
          },
        },
      },
    });

    const thumbnail = firstBookmark?.room?.youtube_videos?.thumbnail;

    if (thumbnail) {
      collection = await prisma.collection.update({
        where: { collectionId: collection.collectionId },
        data: { coverImage: thumbnail },
        include: {
          bookmarks: {
            include: { room: { include: { youtube_videos: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }
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

  const roomsMap = collection.bookmarks.reduce(
    (acc, bookmark) => {
      const { room } = bookmark;
      if (!acc[room.roomId]) {
        acc[room.roomId] = {
          roomData: {
            roomId: room.roomId,
            roomName: room.roomName,
            videoTitle: room.youtube_videos.title,
            videoThumbnail: room.youtube_videos.thumbnail || '',
            collectionTitle: collection.title || null,
          },
          bookmarks: [],
        };
      }
      acc[room.roomId].bookmarks.push({
        bookmarkId: bookmark.bookmarkId,
        message: `${String(Math.floor(bookmark.timeline! / 60)).padStart(
          2,
          '0',
        )}:${String(bookmark.timeline! % 60).padStart(2, '0')} ${bookmark.content}`,
        timeline: bookmark.timeline!,
      });
      return acc;
    },
    {} as Record<
      number,
      {
        roomData: {
          roomId: number;
          roomName: string;
          videoTitle: string;
          videoThumbnail: string;
          collectionTitle: string | null;
        };
        bookmarks: {
          bookmarkId: number;
          message: string;
          timeline: number;
        }[];
      }
    >,
  );

  return {
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    bookmarkCount: collection.bookmarkCount,
    visibility: collection.visibility,
    coverImage: collection.coverImage,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    rooms: Object.values(roomsMap),
  };
};

// 4. 컬렉션 수정
export const updateCollection = async (
  collectionId: number,
  userId: number,
  data: { title?: string; description?: string; visibility?: CollectionVisibility },
) => {
  const collection = await prisma.collection.findUnique({ where: { collectionId } });

  if (!collection) {
    throw new AppError('COLLECTION_001', '컬렉션을 찾을 수 없습니다.');
  }
  if (collection.userId !== userId) {
    throw new AppError('COLLECTION_003', '권한이 없습니다.');
  }

  await prisma.collection.update({
    where: { collectionId },
    data,
  });
};

// 5. 컬렉션 삭제
export const deleteCollection = async (collectionId: number, userId: number) => {
  const collection = await prisma.collection.findUnique({ where: { collectionId } });

  if (!collection) {
    throw new AppError('COLLECTION_001', '컬렉션을 찾을 수 없습니다.');
  }
  if (collection.userId !== userId) {
    throw new AppError('COLLECTION_003', '권한이 없습니다.');
  }

  // "정리되지 않은 북마크" 컬렉션으로 북마크 이동
  const defaultCollection = await prisma.collection.findFirst({
    where: { userId, title: '정리되지 않은 북마크' },
  });

  if (defaultCollection) {
    await prisma.bookmark.updateMany({
      where: { collectionId },
      data: { collectionId: defaultCollection.collectionId },
    });
  }

  await prisma.collection.delete({ where: { collectionId } });
};

// 6. 컬렉션 순서 변경
export const updateCollectionOrder = async (
  userId: number,
  collectionOrders: { collectionId: number; order: number }[],
) => {
  await prisma.$transaction(
    collectionOrders.map(({ collectionId, order }) =>
      prisma.collection.updateMany({
        where: { collectionId, userId },
        data: { order },
      }),
    ),
  );
};
