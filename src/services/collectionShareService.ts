import { prisma } from '../lib/prisma.js';
import { saveDirectMessage, getChatRoom } from './messageServices.js';
import { getIO } from '../socket/index.js';
import redis from '../redis.js';
import { USER_SOCKET_KEY } from '../socket/redisManager.js';
import AppError from '../middleware/errors/AppError.js';

export const shareCollectionService = async (
  senderId: number,
  receiverIds: number[],
  collectionId: number,
) => {
  // 1) 컬렉션 정보 조회
  const collection = await prisma.collection.findUnique({
    where: { collectionId },
  });
  if (!collection) throw new Error('컬렉션이 존재하지 않습니다.');

  // 2) 메시지 내용 JSON 생성
  const contentObj = {
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    bookmarkCount: collection.bookmarkCount,
    visibility: collection.visibility,
    coverImage: collection.coverImage,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    message: `${collection.title}컬렉션을 공유했습니다.`,
  };

  const results = [];

  for (const receiverId of receiverIds) {
    try {
      // 3) DB에 채팅 메시지 저장 (messageType: 'collectionShare')
      const message = await saveDirectMessage(senderId, {
        receiverId: receiverId,
        content: JSON.stringify(contentObj),
        type: 'collectionShare',
      });
      console.log('shareCollection 채팅 저장:', message);

      //채팅방 조회
      const DMRoom = await getChatRoom(senderId, receiverId);

      // 공유받은 컬렉션 목록에 추가
      const addSharedList = await prisma.sharedCollection.create({
        data: {
          sharedToUserId: receiverId,
          sharedInChatId: DMRoom.chatId,
          collectionId: collection.collectionId,
        },
      });
      console.log('shareCollection 목록에 추가 완료:', addSharedList);

      //4) 채팅 소캣
      try {
        const io = getIO();

        // Redis에서 친구의 socketId 찾기
        const friendSocketId = await redis.get(USER_SOCKET_KEY(receiverId));

        if (friendSocketId) {
          io.to(friendSocketId).emit('receiveDirectMessage', {
            type: 'receiveDirectMessage',
            data: {
              messageId: message.messageId,
              senderId: message.senderId,
              receiverId: message.receiverId,
              content: contentObj.message,
              messageType: 'collectionShare', //('general','roomInvite','bookmarkShare')
              timestamp: message.timestamp,
              collection: {
                collectionId: collection.collectionId,
                title: collection.title,
                description: collection.description,
                bookmarkCount: collection.bookmarkCount,
                visibility: collection.visibility,
                coverImage: collection.coverImage,
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
              },
            },
          });
          console.log(`컬렉션 공유 채팅: ${message}`);
        }
      } catch (err) {
        console.error('Socket.io 알림 전송 실패:', err);
      }

      //5) 채팅 알림 DB 생성
      //  공유한 사람 정보 조회
      const sender = await prisma.user.findUnique({
        where: { userId: senderId },
        select: {
          userId: true,
          nickname: true,
          profileImage: true,
        },
      });

      // 알림 생성
      const notification = await prisma.notification.create({
        data: {
          fromUserId: senderId,
          toUserId: receiverId,
          type: 'collectionShare',
          title: `${sender?.nickname}님이 ${collection.title} 컬렉션을 채팅으로 공유하였습니다.`,
        },
      });
      console.log('컬렉션 공유 알림 생성:', notification);

      results.push({ receiverId, success: true });
    } catch (err) {
      console.error(`컬렉션 공유 실패 (receiverId: ${receiverId}):`, err);
      results.push({ receiverId, success: false, error: err });
    }
  }

  return results;
};

export const copyCollectionService = async (receiverId: number, collectionId: number) => {
  // 1) 컬렉션 정보 조회
  const collection = await prisma.collection.findUnique({
    where: { collectionId },
  });

  if (!collection) throw new AppError('COLLECTION_001', '컬렉션을 찾을 수 없습니다.');

  if (collection.userId !== receiverId) {
    if (collection.visibility === 'private') {
      throw new AppError('COLLECTION_003', '비공개 컬렉션에 접근할 권한이 없습니다.');
    }
    if (collection.visibility === 'friends') {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { requestedBy: receiverId, requestedTo: collection.userId },
            { requestedBy: collection.userId, requestedTo: receiverId },
          ],
        },
      });
      if (!friendship) {
        throw new AppError('COLLECTION_003', '친구만 접근할 수 있는 컬렉션입니다.');
      }
    }
  }

  const newCollection = await prisma.collection.create({
    data: {
      userId: receiverId,
      title: collection.title,
      description: collection.description,
      bookmarkCount: collection.bookmarkCount,
      visibility: collection.visibility,
      coverImage: collection.coverImage,
    },
  });

  return newCollection;
};
