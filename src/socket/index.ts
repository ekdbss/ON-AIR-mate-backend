import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import chatHandler from './chatHandler.js';
import redis from '../redis.js';
import { findUserByToken } from '../services/authServices.js';
import { onlineUser, offlineUser } from './redisManager.js';

let io: Server;

export const initSocketServer = async (server: HTTPServer) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://54.180.254.48:3000',
    'https://onairmate.duckdns.org',
  ];
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('[Socket] Authentication error: No token'));
    }

    const user = await findUserByToken(token);
    if (!user) {
      return next(new Error('[Socket] 유효하지 않은 토큰입니다.'));
    }
    socket.data.user = {
      id: user.userId.toString(),
      nickname: user.nickname,
      userId: user.userId,
    }; // socket.data에 사용자 정보 저장

    console.log('🔗[Socket] 유저: ', socket.data.user.id, ', ', socket.data.user.nickname);
    next(); // 다음 미들웨어 또는 연결 승인
  });

  // Redis 연결 테스트 (ping)
  try {
    const pong = await redis.ping();
    console.log(`✅[Redis] Redis 연결 성공 (PING 응답: ${pong})`);
  } catch (err) {
    console.error('❌[Redis]Redis 연결 실패:', err);
    process.exit(1);
  }

  io.on('connection', socket => {
    const user = socket.data.user;
    console.log('🚀[Socket] 유저 접속:', user.nickname, ', 소캣: ', socket.id);
    onlineUser(Number(user.id), socket.id);

    chatHandler(io!, socket);

    socket.on('disconnect', async () => {
      await offlineUser(Number(socket.data.user.id), socket.id);
      console.log('❌[Socket] 연결 해제:', socket.id);
    });
  });

  console.log('✅[Socket] Socket.io 서버 초기화 완료');
  return io;
};

export function getIO(): Server {
  if (!io) {
    throw new Error('[Socket] Socket.io not initialized');
  }
  return io;
}
