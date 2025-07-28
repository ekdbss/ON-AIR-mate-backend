import { PrismaClient, UserChatMessage } from '@prisma/client';
import { SaveRoomMessageInput, SendDirectMessageDTO, RoomMessageDTO } from '../dtos/messageDto';

const prisma = new PrismaClient();

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

  const roomMessageDTO = {
    messageId: message.messageId, // Prisma 모델에서 메시지 PK
    userId: message.userId,
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
    senderId,
    receiverId,
    content: message.content,
    messageType: message.type,
    createdAt: message.createdAt,
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

  return messages.reverse().map((msg: UserChatMessage) => ({
    messageId: msg.messageId,
    senderId: msg.userId,
    receiverId: receiverId,
    content: msg.content,
    messageType: msg.type,
    timestamp: msg.createdAt.toISOString(),
  }));
};
