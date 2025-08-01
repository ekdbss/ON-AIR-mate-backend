import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { s3Client, S3_BUCKET_NAME } from '../config/s3Config.js';
import AppError from './errors/AppError.js';

// Express Request 타입 확장
interface AuthRequest extends Request {
  user?: {
    id: string;
    nickname: string;
    userId: number;
  };
}

// 파일 필터 (이미지만 허용)
const fileFilter = (req: AuthRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 디버깅용 로그
  console.log('>>> 업로드 파일 정보:', {
    mimetype: file.mimetype,
    originalname: file.originalname,
    fieldname: file.fieldname,
    encoding: file.encoding,
  });

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', // 추가
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml', // SVG 추가 (선택사항)
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `허용되지 않는 파일 형식: ${file.mimetype}. 허용된 형식: ${allowedMimeTypes.join(', ')}`,
      ),
    );
  }
};

// S3 업로드 설정
const s3Storage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req: AuthRequest, file: Express.Multer.File, cb) => {
    const userId = req.user?.userId || 'anonymous';
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExtension = path.extname(file.originalname);

    // S3 키 형식: profile-images/{userId}/{timestamp}-{random}.{ext}
    const s3Key = `profile-images/${userId}/${Date.now()}-${uniqueSuffix}${fileExtension}`;
    cb(null, s3Key);
  },
  metadata: (req: AuthRequest, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.userId?.toString() || 'anonymous',
    });
  },
});

// Multer 인스턴스 생성
export const uploadProfileImage = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 5MB 제한
  },
}).single('profileImage');

// 에러 핸들링 미들웨어
export const handleUploadError = (
  error: Error | multer.MulterError | null,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof multer.MulterError) {
    console.log('Multer 에러:', error.code, error.message);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('FILE_001', '파일 크기가 50MB를 초과했습니다.'));
    }
    return next(new AppError('FILE_002', `파일 업로드 실패: ${error.message}`));
  } else if (error) {
    console.log('업로드 에러:', error.message);

    // fileFilter에서 던진 구체적인 에러 메시지 전달
    if (error.message.includes('허용되지 않는 파일 형식')) {
      return next(new AppError('FILE_004', error.message));
    }

    // 기타 에러
    return next(new AppError('FILE_002', error.message));
  }
  next();
};
