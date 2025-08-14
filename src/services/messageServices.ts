import { ChatMessageType } from '@prisma/client';
import { SaveRoomMessageInput, SendDirectMessageDTO, RoomMessageDTO } from '../dtos/messageDto.js';
import { createBookmarkFromSocket } from './bookmarkService.js';
import { prisma } from '../lib/prisma.js';
import AppError from '../middleware/errors/AppError.js';

interface BaseMessage {
  messageId: number;
  senderId: number;
  receiverId: number;
  content: string | null;
  messageType: ChatMessageType;
  timestamp: string;
}

interface CollectionMessage extends BaseMessage {
  collection: {
    collectionId: number;
    title: string;
    description: string | null;
    bookmarkCount: number;
    visibility: string;
    coverImage: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface RoomMessage extends BaseMessage {
  room: {
    roomId: number;
    roomTitle: string;
    video: {
      title: string;
    };
  };
}

type DirectMessage = BaseMessage | CollectionMessage | RoomMessage;

/**
 * room 채팅
 */
//room 메시지 조회
export const getRoomMessages = async (roomId: number) => {
  const messages = await prisma.roomMessage.findMany({
    where: {
      roomId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          userId: true,
          nickname: true,
          profileImage: true,
        },
      },
    },
  });

  const result = await Promise.all(
    messages.reverse().map(async msg => {
      return {
        messageId: msg.messageId,
        userId: msg.userId,
        nickname: msg.user.nickname,
        profileImage: msg.user.profileImage,
        content: msg.content,
        messageType: msg.type,
        timestamp: msg.createdAt.toISOString(),
      };
    }),
  );

  return result;
};

//room  메시지 저장
export const saveRoomMessage = async ({
  roomId,
  userId,
  content,
  messageType,
}: SaveRoomMessageInput) => {
  const room = await prisma.room.findUnique({
    where: { roomId: roomId },
  });

  if (!room) {
    throw new AppError('GENERAL_001', '유효한 방 ID가 필요합니다.');
  }

  if (!content || content.trim().length === 0) {
    throw new AppError('CHAT_001');
  }

  if (messageType !== 'general' && messageType !== 'system') {
    throw new AppError('CHAT_002', 'messageType은 general 이나 system이어야 합니다.');
  }

  //roomMaessage 생성.
  const message = await prisma.roomMessage.create({
    data: {
      roomId,
      userId,
      content,
      type: messageType,
    },
    include: {
      user: {
        select: {
          nickname: true,
          profileImage: true,
        },
      },
    },
  });

  //북마크면 북마크 db 생성
  if (messageType === 'system') {
    try {
      await createBookmarkFromSocket(userId, roomId, content);
    } catch (err) {
      console.log(
        '[Bookmark] 소켓 기반 북마크 생성 실패:',
        err instanceof Error ? err.message : String(err),
      );
      throw new AppError('CHAT_003', '소켓 기반 북마크 생성 실패');
    }
  }

  const roomMessageDTO = {
    messageId: message.messageId, // Prisma 모델에서 메시지 PK
    userId: message.userId,
    nickname: message.user.nickname,
    profileImage: message.user.profileImage ?? '',
    content: message.content,
    messageType: message.type,
    timestamp: message.createdAt,
  } satisfies RoomMessageDTO;
  return roomMessageDTO;
};

/**
 * 1:1 채팅
 */
//채팅방 생성 및 조회
export const getOrCreateChatRoom = async (user1Id: number, user2Id: number) => {
  const [u1, u2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const existingChat = await prisma.userChat.findFirst({
    where: {
      user1Id: u1,
      user2Id: u2,
    },
  });

  if (existingChat) return existingChat;

  return await prisma.userChat.create({
    data: {
      user1Id: u1,
      user2Id: u2,
    },
  });
};

//채팅방 단순 조회
export const getChatRoom = async (user1Id: number, user2Id: number) => {
  const [u1, u2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const existingChat = await prisma.userChat.findFirst({
    where: {
      user1Id: u1,
      user2Id: u2,
    },
  });
  if (existingChat) {
    return existingChat;
  }

  throw new Error('해당 사용자들 간의 채팅방이 존재하지 않습니다.');
};

//채팅 메시지 저장
export const saveDirectMessage = async (senderId: number, payload: SendDirectMessageDTO) => {
  const { receiverId, content, type } = payload;

  // 1. 채팅방 조회
  const chat = await getOrCreateChatRoom(senderId, receiverId);

  // 2. 메시지 저장
  const message = await prisma.userChatMessage.create({
    data: {
      chatId: chat.chatId,
      userId: senderId,
      content,
      type: type,
    },
    include: {
      user: {
        select: {
          nickname: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    messageId: message.messageId,
    senderId: message.userId,
    receiverId,
    content: message.content,
    messageType: message.type,
    timestamp: message.createdAt.toISOString(),
  };
};

//채팅 내역 조회
export const getDirectMessages = async (userId: number, receiverId: number) => {
  const chat = await getChatRoom(userId, receiverId);
  const chatId = chat.chatId;
  const messages = await prisma.userChatMessage.findMany({
    where: {
      chatId,
    },
    orderBy: { createdAt: 'desc' },
  });

  const result: DirectMessage[] = [];

  for (const msg of messages.reverse()) {
    let base: DirectMessage = {
      messageId: msg.messageId,
      senderId: msg.userId,
      receiverId,
      content: msg.content,
      messageType: msg.type,
      timestamp: msg.createdAt.toISOString(),
    };

    // 메시지 타입에 따라 추가 정보 붙이기
    if (msg.type === 'collectionShare' && msg.content) {
      try {
        const contentObj = JSON.parse(msg.content);
        const collectionId = contentObj.collectionId;
        const collection = await prisma.collection.findUnique({
          where: { collectionId },
          select: {
            collectionId: true,
            title: true,
            description: true,
            bookmarkCount: true,
            visibility: true,
            coverImage: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (collection) {
          base.content = contentObj.message;
          base = { ...base, collection };
        }
      } catch {
        console.log('[messagType: collectionShare] parsing error or no room found');
      }
    } else if (msg.type === 'roomInvite' && msg.content) {
      try {
        const contentObj = JSON.parse(msg.content);
        const { message, roomName, ...room1 } = contentObj;
        base.content = message;
        let room;
        if (roomName) {
          room = {
            roomTitle: roomName,
            ...room1,
          };
        } else {
          room = room1;
        }

        base = { ...base, room };
      } catch {
        // parsing error or no room found
        console.log('[messagType: roomInvite] parsing error or no room found');
      }
    }
    // general 등 다른 타입은 그대로

    result.push(base);
  }
  return result;
};
