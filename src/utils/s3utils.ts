import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../config/s3Config.js';

export const deleteS3Object = async (imageUrl: string): Promise<void> => {
  try {
    // URL에서 S3 키 추출
    const url = new URL(imageUrl);
    const key = url.pathname.substring(1); // 맨 앞의 '/' 제거

    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`S3 객체 삭제 성공: ${key}`);
  } catch (error) {
    console.error('S3 객체 삭제 실패:', error);
    // 실패해도 계속 진행 (로그만 남김)
  }
};
