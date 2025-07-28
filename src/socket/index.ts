import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import chatHandler from './chatHandler.js';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { findUserByToken } from '../services/authServices.js';
import { onlineUser, offlineUser } from './redisManager.js';

let io: Server;

export const initSocketServer = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === 'development'
          ? 'production'
          : process.env.ALLOWED_ORIGINS?.split(',') || [],
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const user = await findUserByToken(token);
    if (!user) {
      return next(new Error('유효하지 않은 토큰입니다.'));
    }
    socket.data.user = {
      id: user.userId.toString(),
      nickname: user.nickname,
      userId: user.userId,
    }; // socket.data에 사용자 정보 저장

    console.log('🔗유저: ', socket.data.user.id, ', ', socket.data.user.nickname);
    next(); // 다음 미들웨어 또는 연결 승인
  });

  const pubClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  });

  pubClient.on('error', err => {
    console.error('Redis 연결 에러:', err);
    process.exit(1);
  });

  const subClient = pubClient.duplicate();
  subClient.on('error', err => {
    console.error('Redis 구독 클라이언트 에러:', err);
  });

  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter set');

  io.on('connection', socket => {
    const user = socket.data.user;
    console.log('🚀 유저 접속:', user.nickname, ', 소캣: ', socket.id);
    onlineUser(Number(user.id), socket.id);

    chatHandler(io!, socket);

    socket.on('disconnect', () => {
      offlineUser(socket.data.user.id, socket.id);
      console.log('❌ 연결 해제:', socket.id);
    });
  });

  return io;
};

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
