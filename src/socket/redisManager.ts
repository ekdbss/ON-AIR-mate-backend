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
  await redis.set(USER_STATUS_KEY(userId), 'online');
  await redis.set(USER_SOCKET_KEY(userId), socketId);
  await redis.set(SOCKET_USER_KEY(socketId), userId.toString());
};

export const offlineUser = async (userId: number, socketId: string) => {
  await redis.set(USER_STATUS_KEY(userId), 'offline');
  await redis.del(USER_SOCKET_KEY(userId));
  await redis.del(SOCKET_USER_KEY(socketId));
};

/**
  Room
 */
export const joinRoom = async (roomId: number, userId: number, socketId: string) => {
  await redis.sadd(ROOM_PARTICIPANTS_KEY(roomId), userId);
  await redis.incr(ROOM_PARTICIPANTS_COUNT_KEY(roomId));
  await redis.set(USER_SOCKET_KEY(userId), socketId, 'NX'); // NX = Only if not exists
  await redis.set(SOCKET_USER_KEY(socketId), userId.toString(), 'NX');
  await redis.sadd(USER_ROOMS_KEY(userId), roomId.toString());
};

export const enterRoom = async (userId: number, socketId: string) => {
  await redis.set(USER_SOCKET_KEY(userId), socketId, 'NX'); // NX = Only if not exists
  await redis.set(SOCKET_USER_KEY(socketId), userId.toString(), 'NX');
};

export const leaveRoom = async (roomId: number, userId: number) => {
  await redis.srem(ROOM_PARTICIPANTS_KEY(roomId), userId);
  await redis.decr(ROOM_PARTICIPANTS_COUNT_KEY(roomId));
  await redis.srem(USER_ROOMS_KEY(userId), roomId.toString());
};

export const getRoomSize = async (roomId: number): Promise<number> => {
  const count = await redis.get(ROOM_PARTICIPANTS_COUNT_KEY(roomId));
  return count ? parseInt(count, 10) : 0;
};

export const getUserIdFromSocket = async (socketId: string): Promise<number> => {
  const userId = await redis.get(SOCKET_USER_KEY(socketId));
  return userId ? parseInt(userId, 10) : 0;
};

export const isParticipant = async (roomId: number, userId: number): Promise<boolean> => {
  const key = ROOM_PARTICIPANTS_KEY(roomId);
  const result = await redis.sismember(key, userId);
  return result === 1;
};
