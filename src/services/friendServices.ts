// src/services/friendService.ts
import { FriendshipStatus } from '@prisma/client';
import AppError from '../middleware/errors/AppError.js';
import { prisma } from '../lib/prisma.js';
import { getIO } from '../socket/index.js';
import redis from '../redis.js';
import { USER_SOCKET_KEY } from '../socket/redisManager.js';
import { saveDirectMessage } from './messageServices.js';

// 타입 정의
interface Friend {
  userId: number;
  nickname: string;
  profileImage: string | null;
  popularity: number;
  isOnline: boolean | null;
}

interface FriendRequest {
  requestId: number;
  userId: number;
  nickname: string;
  profileImage: string | null;
  popularity: number;
  requestedAt: string;
}

interface SearchUser {
  userId: number;
  nickname: string;
  profileImage: string | null;
  popularity: number;
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected';
}

interface FriendLounge {
  collectionId: number;
  title: string;
  description: string | null;
  bookmarkCount: number;
  visibility: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 친구 목록 조회
 */
export const getFriendsList = async (userId: number): Promise<Friend[]> => {
  try {
    // 양방향 친구 관계 조회 (requestedBy 또는 requestedTo가 userId이고 status가 accepted인 경우)
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requestedBy: userId, status: 'accepted' },
          { requestedTo: userId, status: 'accepted' },
        ],
      },
      include: {
        requester: {
          select: {
            userId: true,
            nickname: true,
            profileImage: true,
            popularity: true,
          },
        },
        receiver: {
          select: {
            userId: true,
            nickname: true,
            profileImage: true,
            popularity: true,
          },
        },
      },
    });

    // 친구 목록 생성
    const friends = friendships.map(friendship => {
      const friend = friendship.requestedBy === userId ? friendship.receiver : friendship.requester;
      return {
        userId: friend.userId,
        nickname: friend.nickname,
        profileImage: friend.profileImage,
        popularity: friend.popularity,
        isOnline: null, // 실시간 온라인 상태는 추후 구현
      };
    });

    return friends;
  } catch {
    throw new AppError('GENERAL_005');
  }
};

/**
 * 친구 요청 전송
 */
export const sendFriendRequest = async (
  requesterId: number,
  targetUserId: number,
): Promise<void> => {
  // 자기 자신에게 요청 불가
  if (requesterId === targetUserId) {
    throw new AppError('FRIEND_003');
  }

  // 대상 유저 존재 확인
  const targetUser = await prisma.user.findUnique({
    where: { userId: targetUserId },
  });

  if (!targetUser) {
    throw new AppError('FRIEND_005');
  }

  // 차단 확인
  const isBlocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerUserId: requesterId, blockedUserId: targetUserId, isActive: true },
        { blockerUserId: targetUserId, blockedUserId: requesterId, isActive: true },
      ],
    },
  });

  if (isBlocked) {
    throw new AppError('FRIEND_004');
  }

  // 기존 친구 관계 확인 (양방향)
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: requesterId, requestedTo: targetUserId },
        { requestedBy: targetUserId, requestedTo: requesterId },
      ],
    },
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new AppError('FRIEND_001');
    } else if (existingFriendship.status === 'pending') {
      throw new AppError('FRIEND_002');
    }
  }

  // 트랜잭션으로 친구 요청과 알림을 함께 생성
  await prisma.$transaction(async tx => {
    await tx.friendship.create({
      data: {
        requestedBy: requesterId,
        requestedTo: targetUserId,
        status: 'pending',
      },
    });

    await tx.notification.create({
      data: {
        fromUserId: requesterId,
        toUserId: targetUserId,
        type: 'friendRequest',
        title: '새로운 친구 요청이 있습니다.',
      },
    });
  });
};

/**
 * 받은 친구 요청 목록 조회
 */
export const getFriendRequests = async (userId: number): Promise<FriendRequest[]> => {
  const requests = await prisma.friendship.findMany({
    where: {
      requestedTo: userId,
      status: 'pending',
    },
    include: {
      requester: {
        select: {
          userId: true,
          nickname: true,
          profileImage: true,
          popularity: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return requests.map(request => ({
    requestId: request.friendshipId,
    userId: request.requester.userId,
    nickname: request.requester.nickname,
    profileImage: request.requester.profileImage,
    popularity: request.requester.popularity,
    requestedAt: request.createdAt.toISOString(),
  }));
};

/**
 * 친구 요청 수락/거절
 */
export const handleFriendRequest = async (
  userId: number,
  requestId: number,
  action: 'ACCEPT' | 'REJECT',
): Promise<string> => {
  // 친구 요청 확인
  const request = await prisma.friendship.findUnique({
    where: { friendshipId: requestId },
  });

  if (!request) {
    throw new AppError('FRIEND_006');
  }

  // 본인에게 온 요청인지 확인
  if (request.requestedTo !== userId) {
    throw new AppError('GENERAL_002');
  }

  // 이미 처리된 요청인지 확인
  if (request.status !== 'pending') {
    throw new AppError('GENERAL_001');
  }

  // 요청 처리
  const newStatus: FriendshipStatus = action === 'ACCEPT' ? 'accepted' : 'rejected';

  await prisma.friendship.update({
    where: { friendshipId: requestId },
    data: {
      status: newStatus,
      acceptedAt: action === 'ACCEPT' ? new Date() : null,
      isAccepted: action === 'ACCEPT',
    },
  });

  return action === 'ACCEPT' ? '친구 요청을 수락했습니다.' : '친구 요청을 거절했습니다.';
};

/**
 * 친구 삭제
 */
export const deleteFriend = async (userId: number, friendId: number): Promise<void> => {
  // 친구 관계 확인 (양방향)
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: userId, requestedTo: friendId, status: 'accepted' },
        { requestedBy: friendId, requestedTo: userId, status: 'accepted' },
      ],
    },
  });

  if (!friendship) {
    throw new AppError('FRIEND_007');
  }

  // 친구 관계 삭제
  await prisma.friendship.delete({
    where: { friendshipId: friendship.friendshipId },
  });
};

/**
 * 닉네임으로 사용자 검색
 */
export const searchUserByNickname = async (
  nickname: string,
  currentUserId: number,
): Promise<SearchUser[]> => {
  const users = await prisma.user.findMany({
    where: {
      nickname: nickname, // 완전 일치
    },
    select: {
      userId: true,
      nickname: true,
      profileImage: true,
      popularity: true,
    },
  });

  // 검색 결과가 없으면 바로 반환
  if (users.length === 0) {
    return [];
  }

  // 모든 사용자와의 friendship 관계를 한 번에 조회
  const userIds = users.map(user => user.userId);
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requestedBy: currentUserId, requestedTo: { in: userIds } },
        { requestedBy: { in: userIds }, requestedTo: currentUserId },
      ],
    },
  });

  // friendship 맵 생성 (userId -> status)
  const friendshipMap = new Map<number, 'none' | 'pending' | 'accepted' | 'rejected'>();
  friendships.forEach(friendship => {
    const otherUserId =
      friendship.requestedBy === currentUserId ? friendship.requestedTo : friendship.requestedBy;
    friendshipMap.set(otherUserId, friendship.status as 'pending' | 'accepted' | 'rejected');
  });

  // 사용자 정보와 친구 관계 상태 결합
  const usersWithRequestStatus: SearchUser[] = users.map(user => ({
    ...user,
    requestStatus: (friendshipMap.get(user.userId) || 'none') as
      | 'none'
      | 'pending'
      | 'accepted'
      | 'rejected',
  }));

  return usersWithRequestStatus;
};

/**
 * 친구 방 초대
 */
export const inviteFriendToRoom = async (
  userId: number,
  friendId: number,
  roomId: number,
): Promise<void> => {
  // 친구 관계 확인
  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: userId, requestedTo: friendId, status: 'accepted' },
        { requestedBy: friendId, requestedTo: userId, status: 'accepted' },
      ],
    },
  });

  if (!isFriend) {
    throw new AppError('FRIEND_007');
  }

  // 방 존재 및 권한 확인
  const room = await prisma.room.findUnique({
    where: { roomId },
    include: {
      participants: {
        where: { userId, left_at: null },
      },
    },
  });

  if (!room) {
    throw new AppError('ROOM_001');
  }

  // 초대 권한 확인 (inviteAuth가 'host'인 경우 방장만 가능)
  if (room.inviteAuth === 'host' && room.hostId !== userId) {
    throw new AppError('FRIEND_008');
  }

  // 참가자인지 확인
  if (room.participants.length === 0) {
    throw new AppError('ROOM_006');
  }

  // 친구가 이미 방에 있는지 확인
  const isAlreadyInRoom = await prisma.roomParticipant.findFirst({
    where: {
      roomId,
      userId: friendId,
      left_at: null,
    },
  });

  if (isAlreadyInRoom) {
    throw new AppError('ROOM_005'); // 이미 참여 중인 방입니다
  }

  // 방 정원 확인
  const currentParticipants = await prisma.roomParticipant.count({
    where: {
      roomId,
      left_at: null,
    },
  });

  if (currentParticipants >= room.maxParticipants) {
    throw new AppError('ROOM_002'); // 방이 가득 찼습니다
  }

  const result = await prisma.$transaction(async tx => {
    // 1. 알림 생성
    const notification = await tx.notification.create({
      data: {
        fromUserId: userId,
        toUserId: friendId,
        type: 'roomInvite',
        title: `${room.roomName} 방에 초대되었습니다.`,
      },
    });

    // 2. 초대한 사람 정보 조회
    const inviter = await tx.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        nickname: true,
        profileImage: true,
      },
    });

    // 3. 방의 영상 정보 조회
    const video = await tx.youtubeVideo.findUnique({
      where: { videoId: room.videoId },
      select: {
        title: true,
        thumbnail: true,
      },
    });

    return { notification, inviter, video };
  });

  let message;
  // 4. 1:1 채팅 메시지로도 저장
  try {
    message = await saveDirectMessage(userId, {
      receiverId: friendId,
      content: JSON.stringify({
        roomId: room.roomId,
        roomName: room.roomName,
        videoTitle: result.video?.title || '',
        message: `${room.roomName} 방에 초대했습니다.`,
      }),
      type: 'roomInvite',
    });
  } catch (error) {
    console.error('초대 채팅 메시지 저장 실패:', error);
  }

  // 5. Socket.IO로 실시간 알림 전송
  try {
    const io = getIO();

    // Redis에서 친구의 socketId 찾기
    const friendSocketId = await redis.get(USER_SOCKET_KEY(friendId));

    if (friendSocketId) {
      // 특정 소켓으로 방 초대 알림 전송

      io.to(friendSocketId).emit('receiveDirectMessage', {
        senderId: result.inviter!.userId,
        receiverId: friendId,
        content: `${room.roomName} 방에 초대했습니다.`,
        messageType: 'roomInvite', //('general','roomInvite','bookmarkShare')
        createdAt: message?.createdAt,
        roomInvite: {
          inviter: {
            userId: result.inviter!.userId,
            nickname: result.inviter!.nickname,
            profileImage: result.inviter!.profileImage,
          },
          room: {
            roomId: room.roomId,
            roomName: room.roomName,
            currentParticipants: currentParticipants,
            maxParticipants: room.maxParticipants,
            isPrivate: !room.isPublic,
          },
          video: {
            title: result.video?.title || '',
            thumbnail: result.video?.thumbnail || '',
          },
          invitedAt: new Date().toISOString(),
        },
      });

      console.log(`방 초대 알림 전송: ${userId} -> ${friendId} (방: ${roomId})`);
    }
  } catch (error) {
    // Socket 전송 실패해도 초대는 성공으로 처리
    console.error('방 초대 소켓 알림 전송 실패:', error);
  }
};

/**
 * 친구의 라운지 조회 (공개된 컬렉션만)
 */
export const getFriendLounge = async (
  userId: number,
  friendId: number,
): Promise<FriendLounge[]> => {
  // 친구 관계 확인
  const isFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requestedBy: userId, requestedTo: friendId, status: 'accepted' },
        { requestedBy: friendId, requestedTo: userId, status: 'accepted' },
      ],
    },
  });

  if (!isFriend) {
    throw new AppError('FRIEND_007');
  }

  // 친구의 공개 컬렉션 조회 (friends 또는 public)
  const collections = await prisma.collection.findMany({
    where: {
      userId: friendId,
      visibility: {
        in: ['friends', 'public'],
      },
    },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return collections.map(collection => ({
    collectionId: collection.collectionId,
    title: collection.title,
    description: collection.description,
    bookmarkCount: collection._count.bookmarks,
    visibility:
      collection.visibility === 'friends' ? 'FRIENDS_ONLY' : collection.visibility.toUpperCase(),
    coverImage: collection.coverImage,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  }));
};
