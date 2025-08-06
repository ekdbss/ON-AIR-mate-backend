import { prisma } from '../lib/prisma.js';
import { SharedCollectionResponseDto } from '../dtos/sharedCollectionDto.js';
import AppError from '../middleware/errors/AppError.js';

export class SharedCollectionService {
  // 1. 공유받은 컬렉션 목록 조회
  async getReceivedCollections(userId: number): Promise<SharedCollectionResponseDto[]> {
    const sharedCollections = await prisma.sharedCollection.findMany({
      where: { sharedToUserId: userId },
      include: {
        collection: {
          include: {
            user: true, // fromUser 정보
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sharedCollections.map(sc => ({
      sharedCollectionId: sc.shareId,
      originalCollectionId: sc.collection.collectionId,
      title: `공유받은 컬렉션 by ${sc.collection.user.nickname}`,
      fromUserId: sc.collection.user.userId,
      fromUserNickname: sc.collection.user.nickname,
      bookmarkCount: sc.collection.bookmarkCount,
      sharedAt: sc.createdAt,
    }));
  }

  // 2. 공유 컬렉션 수락/거절 처리
  async respondToSharedCollection(
    userId: number,
    sharedCollectionId: number,
    action: 'ACCEPT' | 'REJECT',
  ): Promise<string> {
    const shared = await prisma.sharedCollection.findUnique({
      where: { shareId: sharedCollectionId },
      include: { collection: true },
    });

    if (!shared || shared.sharedToUserId !== userId) {
      throw new AppError('해당 공유 정보를 찾을 수 없거나 권한이 없습니다.');
    }

    if (action === 'REJECT') {
      await prisma.sharedCollection.delete({
        where: { shareId: sharedCollectionId },
      });
      return '컬렉션을 거절했습니다.';
    }

    if (action === 'ACCEPT') {
      // 1. 복사된 컬렉션 생성
      const copiedCollection = await prisma.collection.create({
        data: {
          userId,
          title: shared.collection.title,
          description: shared.collection.description,
          visibility: 'private',
          originalCollectionId: shared.collection.collectionId,
          coverImage: shared.collection.coverImage,
        },
      });

      // 2. 원본 컬렉션 ID 저장
      const originalCollectionId = shared.collection.collectionId;

      // 3. 북마크 복사
      const bookmarks = await prisma.bookmark.findMany({
        where: { collectionId: originalCollectionId },
        include: {
          room: {
            select: {
              videoId: true,
            },
          },
        },
      });

      // 4. 북마크 생성할 데이터 생성
      const copiedBookmarks = bookmarks.map(b => ({
        userId: userId,
        roomId: b.roomId,
        collectionId: copiedCollection.collectionId,
        timeline: b.timeline,
        content: b.content,
        originalBookmarkId: b.bookmarkId,
      }));

      await prisma.bookmark.createMany({
        data: copiedBookmarks,
      });

      // 5. 공유 기록 삭제
      await prisma.sharedCollection.delete({
        where: { shareId: sharedCollectionId },
      });

      return '컬렉션을 수락했습니다.';
    }

    throw new AppError('잘못된 요청입니다.');
  }
}
