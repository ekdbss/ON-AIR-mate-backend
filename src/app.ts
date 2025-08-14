import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import friendRoutes from './routes/friendRoutes.js';
import cors from 'cors';
import errorHandler from './middleware/errors/errorHandler.js';
import AppError from './middleware/errors/AppError.js';
import { sendSuccess } from './utils/response.js';
import { requireAuth } from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import youtubeRoutes from './routes/youtubeRoute.js';
import userRoutes from './routes/userRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';
import { createServer } from 'http';
import { initSocketServer } from './socket/index.js';
import redis from './redis.js';
import aiSummaryRoutes from './routes/aiSummaryRoutes.js';
import roomRoutes from './routes/roomRoute.js';
import chatDirectRoutes from './routes/chatDirectRoute.js';
import notificationRoutes from './routes/notificationRoutes.js';
import collectionRoute from './routes/collectionRoutes.js';
import sharedCollectionRoute from './routes/sharedCollectionRoute.js';
import blockRoutes from './routes/blockRoute.js';
import bookmarkRoutes from './routes/bookmarkRoute.js';
dotenv.config();

const app: Express = express();
const server = createServer(app);

try {
  await initSocketServer(server); // socket.io 연결
} catch (error) {
  console.error('Socket.IO 서버 초기화 실패:', error);
  process.exit(1);
}

(async () => {
  try {
    const pong = await redis.ping();
    console.log('🏓 Redis PING response:', pong);
  } catch (err) {
    console.error('🔥 Redis PING failed:', err);
  }
})();

const port = process.env.PORT || 3000;
const address = process.env.ADDRESS;

app.enable('trust proxy');

if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// CORS 설정
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    console.log('start: 배포 연결 실행');

    // 프로덕션 환경에서는 허용된 도메인만
    const allowedOrigins = [
      //수정1
      address,
      'https://54.180.254.48',
      'https://onairmate.duckdns.org',
      'http://localhost:3000', // 로컬 개발용
      'http://localhost:3001', // 로컬 개발용
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24시간
};

app.use(cors(corsOptions));

// JSON 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 보안 헤더 설정
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 인증이 필요한 라우트 예시
app.get('/protected', requireAuth, (req: Request, res: Response) => {
  sendSuccess(res, {
    message: '인증된 사용자만 접근 가능',
    user: req.user,
  });
});

// API 문서 (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 헬스 체크 엔드포인트
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns a hello world message
 *     tags: [Default]
 *     responses:
 *       200:
 *         description: The hello world message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                 error:
 *                   type: object
 */
app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, { message: 'Hello World!' });
});

// API 라우트들을 여기에 추가
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/chat/direct', chatDirectRoutes);
app.use('/api/youtube', youtubeRoutes); // youtubeRecommendationRoute와 youtubeSearchRoute 병합
app.use('/api/collections', collectionRoute);
app.use('/api/shared-collections', sharedCollectionRoute);
app.use('/api/friends', friendRoutes);
app.use('/api/ai', aiSummaryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// 404 에러 핸들링
app.use((req: Request, res: Response, next: NextFunction) => {
  console.error('app.ts에서 404 에러 발생:', req.originalUrl);
  next(new AppError('GENERAL_003')); // 404 에러 코드 사용
});
// 전역 에러 핸들러
app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Docs available at http://localhost:${port}/api-docs`);
  console.log(`Health check at http://localhost:${port}/health`);
});
