import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../config/s3Config.js';

export const deleteS3Object = async (imageUrl: string): Promise<void> => {
  try {
    // 입력 매개변수 검증
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL provided');
    }

    // URL에서 S3 키 추출
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      throw new Error('Invalid URL format provided');
    }

    // S3 URL인지 검증
    if (!url.hostname.includes('amazonaws.com') || !url.hostname.includes('s3')) {
      throw new Error('URL is not from S3');
    }

    const key = url.pathname.substring(1); // 맨 앞의 '/' 제거

    if (!key) {
      throw new Error('Unable to extract S3 key from URL');
    }

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`S3 객체 삭제 성공: ${key}`);
  } catch (error) {
    console.error('S3 객체 삭제 실패:', error);
    // 호출자가 실패를 처리할 수 있도록 에러를 다시 던집니다
    throw error;
  }
};
