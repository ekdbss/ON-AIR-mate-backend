import redis from '../redis.js';

export const ROOM_PARTICIPANTS_KEY = (roomId: number) => `room:${roomId}:participants`;

export const ROOM_PARTICIPANTS_COUNT_KEY = (roomId: number) => `room:${roomId}:participantsCount`;

export const USER_SOCKET_KEY = (userId: number) => `user:${userId}:socketId`;

export const SOCKET_USER_KEY = (socketId: string) => `socket:${socketId}:userId`;

export const USER_ROOMS_KEY = (userId: number) => `user:${userId}:rooms`;

export const USER_STATUS_KEY = (userId: number) => `user:${userId}:status`;

/**
 * online /offline
 */
export const onlineUser = async (userId: number, socketId: string) => {
  console.log('[Redis] onlineUser 이벤트 처리');
  await redis.set(USER_STATUS_KEY(userId), 'online');
  await redis.set(USER_SOCKET_KEY(userId), socketId);
  await redis.set(SOCKET_USER_KEY(socketId), userId.toString());
};

export const offlineUser = async (userId: number, socketId: string) => {
  console.log('[Redis] offlineUser 이벤트 처리');
  await redis.set(USER_STATUS_KEY(userId), 'offline');
  await redis.del(USER_SOCKET_KEY(userId));
  await redis.del(SOCKET_USER_KEY(socketId));
};

/**
  Room
 */
export const joinRoom = async (roomId: number, userId: number, socketId: string) => {
  console.log('[Redis] joinRoom 이벤트 처리');
  const saddRes1 = await redis.sadd(ROOM_PARTICIPANTS_KEY(roomId), userId);
  const incrRes = await redis.incr(ROOM_PARTICIPANTS_COUNT_KEY(roomId));
  const setRes1 = await redis.set(USER_SOCKET_KEY(userId), socketId);
  const setRes2 = await redis.set(SOCKET_USER_KEY(socketId), userId.toString());
  const saddRes2 = await redis.sadd(USER_ROOMS_KEY(userId), roomId.toString());
  // 검증: sadd/incr 결과가 0이나 null이거나, set 결과가 null이면 실패로 판단
  if (saddRes1 === 0 && incrRes <= 0) {
    throw new Error('[Redis] ROOM_PARTICIPANTS 저장 실패');
  }
  if (!setRes1) {
    throw new Error('[Redis] USER_SOCKET 저장 실패');
  }
  if (!setRes2) {
    throw new Error('[Redis] SOCKET_USER 저장 실패');
  }
  if (saddRes2 === 0) {
    throw new Error('[Redis] USER_ROOMS 저장 실패');
  }

  return {
    participantsAdded: saddRes1,
    participantsCount: incrRes,
    userSocketSet: setRes1,
    socketUserSet: setRes2,
    userRoomsAdded: saddRes2,
  };
};

export const enterRoom = async (userId: number, socketId: string) => {
  console.log('[Redis] enterRoom 이벤트 처리');
  //회원 찾기
  const roomId = await getUserRooms(userId);
  if (!roomId) {
    throw new Error('[Redis] ROOM_PARTICIPANTS 조회 실패');
  }
  await redis.set(USER_SOCKET_KEY(userId), socketId);
  await redis.set(SOCKET_USER_KEY(socketId), userId.toString());
};

export const leaveRoom = async (roomId: number, userId: number) => {
  console.log('[Redis] leaveRoom 이벤트 처리');
  const removed = await redis.srem(ROOM_PARTICIPANTS_KEY(roomId), userId);
  if (removed === 1) await redis.decr(ROOM_PARTICIPANTS_COUNT_KEY(roomId));
  await redis.srem(USER_ROOMS_KEY(userId), roomId.toString());
};

export const getRoomSize = async (roomId: number): Promise<number> => {
  console.log('[Redis] getRoomSize 이벤트 처리');
  const count = await redis.get(ROOM_PARTICIPANTS_COUNT_KEY(roomId));
  return count ? parseInt(count, 10) : 0;
};

export const getUserIdFromSocket = async (socketId: string): Promise<number> => {
  console.log('[Redis] getUserIdFromSocket 이벤트 처리');
  const userId = await redis.get(SOCKET_USER_KEY(socketId));
  return userId ? parseInt(userId, 10) : 0;
};

async function getUserRooms(userId: number) {
  const key = USER_ROOMS_KEY(userId);
  const rooms = await redis.smembers(key); // SET에 저장된 모든 roomId 가져오기
  return rooms; // string[] 형태로 반환
}

export const isParticipant = async (roomId: number, userId: number): Promise<boolean> => {
  console.log('[Redis] isParticipant 이벤트 처리');
  const key = ROOM_PARTICIPANTS_KEY(roomId);
  const result = await redis.sismember(key, userId);
  return result === 1;
};
