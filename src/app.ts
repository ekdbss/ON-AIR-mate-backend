import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import errorHandler from './middleware/errors/errorHandler.js';
import AppError from './middleware/errors/AppError.js';
import { sendSuccess } from './utils/response.js';
import { requireAuth } from './middleware/authMiddleware.js';
import youtubeRoutes from './routes/recommendationRoute.js';
import youtubeSearchRouter from './routes/youtubeSearchRoute.js';
import youtubeDetailRouter from './routes/youtubeDetailRoute.js';
import authRoutes from './routes/authRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const address = process.env.ADDRESS;

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
      'https://54.180.254.48:3000',
      //'https://your-frontend-domain.com', // 실제 프론트엔드 도메인으로 변경
      //'https://onairmate.vercel.app', // 예시 도메인
      'http://localhost:3000', // 로컬 개발용
      'http://localhost:3001', // 로컬 개발용
    ];
    console.log('배포 주소', address);
    console.log('연결 origin:', origin);

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
// app.use('/api/rooms', roomRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/youtube', youtubeSearchRouter);
app.use('/api/youtube/videos', youtubeDetailRouter);

// 404 에러 핸들링
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(404, 'Not Found'));
});

// 전역 에러 핸들러
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Docs available at http://localhost:${port}/api-docs`);
  console.log(`Health check at http://localhost:${port}/health`);
});
