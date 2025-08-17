import redis from '../redis.js';

export const ROOM_PARTICIPANTS_KEY = (roomId: number) => `room:${roomId}:participants`;

export const ROOM_PARTICIPANTS_COUNT_KEY = (roomId: number) => `room:${roomId}:participantsCount`;

export const USER_SOCKET_KEY = (userId: number) => `user:${userId}:socketId`;

export const SOCKET_USER_KEY = (socketId: string) => `socket:${socketId}:userId`;

export const USER_ROOMS_KEY = (userId: number) => `user:${userId}:rooms`;

export const USER_STATUS_KEY = (userId: number) => `user:${userId}:status`;
export const ONLINE_USERS_KEY = 'users:online';

// 방 영상 상태
export const ROOM_VIDEO_STATUS_KEY = (roomId: number) => `room:${roomId}:video:status`; // "playing" | "paused"
export const ROOM_VIDEO_TIME_KEY = (roomId: number) => `room:${roomId}:video:time`; // 초 단위 숫자
export const ROOM_VIDEO_UPDATED_AT_KEY = (roomId: number) => `room:${roomId}:video:updatedAt`; // timestamp

/**
 * online /offline
 */
export const onlineUser = async (userId: number, socketId: string) => {
  console.log('[Redis] onlineUser 이벤트 처리');
  await redis.set(USER_STATUS_KEY(userId), 'online');
  await redis.set(USER_SOCKET_KEY(userId), socketId);
  await redis.set(SOCKET_USER_KEY(socketId), userId.toString());
  await redis.sadd(ONLINE_USERS_KEY, userId.toString());
};

export const offlineUser = async (userId: number, socketId: string) => {
  console.log('[Redis] offlineUser 이벤트 처리');
  await redis.set(USER_STATUS_KEY(userId), 'offline');
  await redis.del(USER_SOCKET_KEY(userId));
  await redis.del(SOCKET_USER_KEY(socketId));
  await redis.srem(ONLINE_USERS_KEY, userId.toString());
};

export const getOnlineUsers = async (): Promise<number[]> => {
  const userIds = await redis.smembers(ONLINE_USERS_KEY);
  return userIds.map(id => parseInt(id, 10));
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
  const remove2 = await redis.srem(USER_ROOMS_KEY(userId), roomId.toString());
  return {
    removeParticipantFromRoom: removed,
    removeRoomFromUser: remove2,
  };
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

export const getRoomParticipants = async (roomId: number): Promise<string[]> => {
  try {
    const participants = await redis.smembers(ROOM_PARTICIPANTS_KEY(roomId));
    return participants;
  } catch (err) {
    console.error(`[Redis] getRoomParticipants Error:`, err);
    return [];
  }
};

export const isParticipant = async (roomId: number, userId: number): Promise<boolean> => {
  console.log('[Redis] isParticipant 이벤트 처리');
  const key = ROOM_PARTICIPANTS_KEY(roomId);
  const result = await redis.sismember(key, userId);
  console.log('[Redis] 참가자 확인 로그:', key, ', ', result);
  return result === 1;
};

/**
 * 방 영상 상태 저장
 */
export const setRoomVideoState = async (
  roomId: number,
  status: 'playing' | 'paused',
  time: number,
) => {
  console.log('[Redis] setRoomVideoState 이벤트 처리');
  const updatedAt = Date.now();
  await redis.mset({
    [ROOM_VIDEO_STATUS_KEY(roomId)]: status,
    [ROOM_VIDEO_TIME_KEY(roomId)]: Math.floor(time),
    [ROOM_VIDEO_UPDATED_AT_KEY(roomId)]: updatedAt,
  });
  // Redis에서 저장된 값 읽기
  const [storedStatus, storedTime, storedUpdatedAt] = await redis.mget(
    ROOM_VIDEO_STATUS_KEY(roomId),
    ROOM_VIDEO_TIME_KEY(roomId),
    ROOM_VIDEO_UPDATED_AT_KEY(roomId),
  );
  return {
    roomId,
    status: storedStatus,
    time: storedTime,
    updatedAt: Number(storedUpdatedAt),
  };
};

/**
 * 영상 재생 시간만 업데이트
 */
export const updateRoomVideoTime = async (roomId: number, time: number) => {
  console.log('[Redis] updateRoomVideoTime 이벤트 처리');
  const rset1 = await redis.set(ROOM_VIDEO_TIME_KEY(roomId), Math.floor(time));
  const rset2 = await redis.set(ROOM_VIDEO_UPDATED_AT_KEY(roomId), Date.now());
  return {
    rset1: rset1,
    rset2: rset2,
  };
};

/**
 * 방 영상 상태 조회
 */
export const getRoomVideoState = async (roomId: number) => {
  console.log('[Redis] getRoomVideoState 이벤트 처리');
  const [status, time, updatedAt] = await redis.mget(
    ROOM_VIDEO_STATUS_KEY(roomId),
    ROOM_VIDEO_TIME_KEY(roomId),
    ROOM_VIDEO_UPDATED_AT_KEY(roomId),
  );
  return {
    status: status || 'paused',
    time: time ? parseInt(time, 10) : 0,
    updatedAt: updatedAt ? parseInt(updatedAt, 10) : Date.now(),
  };
};

//삭제

export const deleteRoomVideoState = async (roomId: number) => {
  const keys = [
    ROOM_VIDEO_STATUS_KEY(roomId),
    ROOM_VIDEO_TIME_KEY(roomId),
    ROOM_VIDEO_UPDATED_AT_KEY(roomId),
  ];
  const res = await redis.del(...keys);
  console.log(`[Redis] 방 영상 상태 삭제: roomId=${roomId}, 삭제된 키 수=${res}`);
  return res;
};

export const removeAllParticipantsFromRoom = async (roomId: number) => {
  console.log(`[Redis] removeAllParticipantsFromRoom 실행: roomId=${roomId}`);

  // 1. 참가자 전체 조회
  const participants = await getRoomParticipants(roomId);

  // 2. 참가자 카운트 키 삭제
  await redis.del(ROOM_PARTICIPANTS_COUNT_KEY(roomId));

  // 3. 참가자별 USER_ROOMS 세트에서도 제거
  for (const userId of participants) {
    await redis.srem(USER_ROOMS_KEY(Number(userId)), roomId.toString());
  }
  // 4. 방 참가자 세트 삭제
  const deletedCount = await redis.del(ROOM_PARTICIPANTS_KEY(roomId));
  return {
    removedUsers: participants.map(Number),
    deletedKeyCount: deletedCount,
  };
};
