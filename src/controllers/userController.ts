import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import * as userService from '../services/userServices.js';
import AppError from '../middleware/errors/AppError.js';
import { uploadProfileImage, handleUploadError } from '../middleware/uploadMiddleware.js';
import { S3_BUCKET_NAME } from '../config/s3Config.js';
import { deleteS3Object } from '../utils/s3utils.js';

// 프로필 정보 조회
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const profile = await userService.getUserProfile(userId);
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

// 프로필 정보 수정
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { nickname, profileImage } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (!nickname && !profileImage) {
      throw new AppError('USER_004');
    }

    // 이미지 URL이 제공된 경우 검증 (선택사항)
    if (profileImage) {
      // S3 URL 형식 검증 - 버킷 이름의 특수문자를 이스케이프
      const escapedBucketName = S3_BUCKET_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Virtual-hosted-style URL 검증
      const virtualHostedStyle = new RegExp(
        `^https://${escapedBucketName}\\.s3\\.[a-z0-9-]+\\.amazonaws\\.com/.+$`,
      );

      // Path-style URL 검증
      const pathStyle = new RegExp(
        `^https://s3\\.[a-z0-9-]+\\.amazonaws\\.com/${escapedBucketName}/.+$`,
      );

      if (!virtualHostedStyle.test(profileImage) && !pathStyle.test(profileImage)) {
        throw new AppError('GENERAL_001', '유효하지 않은 이미지 URL입니다.');
      }
    }

    await userService.updateUserProfile(userId, { nickname, profileImage });
    sendSuccess(res, { message: '프로필이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 프로필 이미지 업로드 핸들러 - 배열로 export
export const uploadProfileImageHandler = [
  uploadProfileImage,
  handleUploadError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      // 토큰 검증 제거 - userId 체크를 하지 않음
      // if (!userId) {
      //   throw new AppError('AUTH_007');
      // }

      // multer-s3를 사용하면 req.file에 location과 key가 추가됩니다
      const file = req.file as Express.MulterS3.File;

      if (!file) {
        throw new AppError('FILE_003');
      }

      // S3에 업로드된 파일의 URL
      const profileImageUrl = file.location;

      // DB 업데이트는 userId가 있을 때만 수행
      if (userId) {
        try {
          await userService.updateUserProfile(userId, {
            profileImage: profileImageUrl,
          });
        } catch (dbError) {
          // S3에서 파일 삭제 시도
          try {
            await deleteS3Object(file.location);
            console.log(`DB 업데이트 실패로 S3 파일 삭제: ${file.key}`);
          } catch (s3Error) {
            console.error('S3 파일 삭제 실패:', s3Error);
          }
          throw dbError;
        }
      }

      sendSuccess(res, {
        message: '프로필 이미지가 업로드되었습니다.',
        profileImage: profileImageUrl,
      });
    } catch (error) {
      next(error);
    }
  },
];

// 알림 설정 조회
export const getNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const settings = await userService.getNotificationSettings(userId);
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

// 알림 설정 수정
export const updateNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    const settings = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    await userService.updateNotificationSettings(userId, settings);
    sendSuccess(res, { message: '알림 설정이 수정되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 참여한 방 목록 조회
export const getParticipatedRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const rooms = await userService.getParticipatedRooms(userId);
    sendSuccess(res, rooms);
  } catch (error) {
    next(error);
  }
};

// 검색 기록 조회
export const getSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const history = await userService.getSearchHistory(userId);
    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

// 의견 보내기
export const sendFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (!content) {
      throw new AppError('GENERAL_001', '의견 내용을 입력해주세요.');
    }

    await userService.sendUserFeedback(userId, content);
    sendSuccess(res, { message: '의견을 보냈습니다. 소중한 의견 감사합니다.' });
  } catch (error) {
    next(error);
  }
};

// 참여한 방 기록 삭제
export const deleteParticipatedRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const roomId = parseInt(req.params.roomId, 10);

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (isNaN(roomId)) {
      throw new AppError('GENERAL_001', '유효하지 않은 방 ID입니다.');
    }

    await userService.deleteParticipatedRoom(userId, roomId);

    sendSuccess(res, {
      success: true,
      message: '참여한 방 기록이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};
