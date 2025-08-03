/**
 * AI 채팅 요약 생성 요청 DTO
 */
export interface GenerateSummaryRequestDto {
  roomId: number;
}

/**
 * AI 채팅 요약 응답 DTO
 */
export interface GenerateSummaryResponseDto {
  summaryId: string;
  roomTitle: string;
  videoTitle: string;
  topicSummary: string;
  emotionAnalysis: string; // "기쁨", "슬픔", "분노", "혐오", "공포", "놀람" 중 하나
  timestamp: string;
}

/**
 * AI 요약 피드백 요청 DTO
 */
export interface SummaryFeedbackRequestDto {
  feedback: 'LIKE' | 'DISLIKE';
  comment?: string;
}

/**
 * AI 요약 피드백 응답 DTO
 */
export interface SummaryFeedbackResponseDto {
  message: string;
}

/**
 * 채팅 메시지 포맷 DTO (내부 사용)
 */
export interface ChatMessageFormatDto {
  nickname: string;
  content: string;
  createdAt: Date;
}

/**
 * Claude 모델 응답 DTO
 */
export interface ClaudeResponseDto {
  topicSummary: string;
  emotionAnalysis: string; // EmotionType + 설명
}

/**
 * 감정 분석 타입
 */
export type EmotionType = '기쁨' | '슬픔' | '분노' | '혐오' | '공포' | '놀람';

/**
 * UserFeedback에 저장될 AI 피드백 데이터 구조
 */
export interface AISummaryFeedbackData {
  type: 'AI_SUMMARY_FEEDBACK';
  summaryId: string;
  roomId: number;
  feedback: 'LIKE' | 'DISLIKE';
  comment?: string;
  timestamp: string;
}
