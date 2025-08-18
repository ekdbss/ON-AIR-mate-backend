import prisma from '../lib/prisma.js';
import AppError from '../middleware/errors/AppError.js';
import { randomUUID } from 'crypto';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import {
  GenerateSummaryRequestDto,
  GenerateSummaryResponseDto,
  ClaudeResponseDto,
  AISummaryFeedbackData,
  EmotionItem,
} from '../dtos/aiSummaryDto.js';

const BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export class AiSummaryService {
  /**
   * 방의 채팅 내역을 가져와서 AI 요약을 생성합니다.
   * DB에 저장하지 않고 바로 응답을 반환합니다.
   */
  async generateChatSummary(
    data: GenerateSummaryRequestDto,
    userId: number,
  ): Promise<GenerateSummaryResponseDto> {
    // 1. 방 정보 확인
    const room = await prisma.room.findUnique({
      where: { roomId: data.roomId },
      include: {
        host: true,
      },
    });

    if (!room) {
      throw new AppError('ROOM_001', '방이 존재하지 않습니다.');
    }

    // 2. 사용자가 방에 참여했는지 확인
    const participant = await prisma.roomParticipant.findFirst({
      where: {
        roomId: data.roomId,
        userId: userId,
      },
    });

    if (!participant) {
      throw new AppError('ROOM_006', '방에 참여하지 않았습니다.');
    }

    // 3. 채팅 메시지 가져오기
    const messages = await prisma.roomMessage.findMany({
      where: {
        roomId: data.roomId,
        type: 'general', // 시스템 메시지 제외
      },
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (messages.length === 0) {
      throw new AppError('GENERAL_003', '요약할 채팅 내역이 없습니다.');
    }

    // 4. 비디오 정보 가져오기
    const video = await prisma.youtubeVideo.findUnique({
      where: { videoId: room.videoId },
    });

    if (!video) {
      throw new AppError('ROOM_007', '유튜브 영상을 찾을 수 없습니다.');
    }

    // 5. 채팅 내용 포맷팅
    const MAX_MESSAGES = 1000;
    const MAX_CONTENT_LENGTH = 50000;
    const limitedMessages = messages.slice(-MAX_MESSAGES);
    const chatContent = limitedMessages
      .map(msg => `${msg.user.nickname}: ${msg.content}`)
      .join('\n')
      .slice(0, MAX_CONTENT_LENGTH);

    // 6. Claude 3.5 Sonnet 모델 호출
    const summary = await this.callClaudeModel(chatContent, video.title);

    // 7. 임시 summaryId 생성
    const summaryId = `summary_${data.roomId}_${randomUUID()}`;

    return {
      summaryId,
      roomTitle: room.roomName,
      videoTitle: video.title,
      topicSummary: summary.topicSummary,
      emotionAnalysis: summary.emotionAnalysis,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Claude 3.5 Sonnet 모델을 호출하여 채팅 요약을 생성합니다.
   */
  private async callClaudeModel(
    chatContent: string,
    videoTitle: string,
  ): Promise<ClaudeResponseDto> {
    const systemPrompt = `당신은 채팅 내용을 분석하고 요약하는 전문가입니다.`;

    const userPrompt = `다음은 "${videoTitle}" 영상을 함께 시청하며 나눈 채팅 내용입니다.
  
  채팅 내용:
  ${chatContent}
  
  위 채팅 내용을 분석하여 다음 두 가지를 한국어로 작성해주세요:
  
  1. 전체 대화 주제 요약 (1문장으로 간결하게 핵심 내용 정리), 딱딱한 AI스러운 말투사용 대신 "대부분 짜증이 난거 같아요!", "많이 슬픈가 보네요.." 등 친근한 형식으로 작성.
  
  2. 대화의 전반적인 감정 분석
  - 전체 대화를 100%로 보고, 감정별 "문장 수" 기준으로 비율 계산(기준 고정).
  - 주요 감정 3~5개를 선정하고, 높은 비율부터 내림차순으로 나열.
  - 표준 감정 카테고리: 기쁨, 슬픔, 분노, 놀람, 감동, 공감, 공포, 좌절, 절망, 당황
  - 각 감정에 해당하는 대표 문장 1~2개를 지정하고, 전체 대비 비율(%) 계산.
  - 백분율은 정수(%)로 반올림하되, 마지막 항목에서 합계가 정확히 100%가 되도록 보정.
  
  응답 형식:
  첫 번째 줄: 주제 요약
  두 번째 줄: 감정 분석 (감정1 n%, 감정2 m%, 감정3 k% 형식)`;

    try {
      const input: InvokeModelCommandInput = {
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      };

      const command = new InvokeModelCommand(input);
      const response: InvokeModelCommandOutput = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as ClaudeResponse;
      const responseText = responseBody.content[0]?.text || '';
      console.log('[AI Summary] 원본 응답:', responseText);

      let topicSummary = '';
      let emotionAnalysis: EmotionItem[] = [];

      // 줄바꿈 기준 파싱
      const lines = responseText
        .trim()
        .split('\n')
        .filter(line => line.trim());

      if (lines.length >= 2) {
        topicSummary = lines[0].trim();
        const emotionText = lines[1].trim();

        // 감정 텍스트를 배열로 파싱
        emotionAnalysis = this.parseEmotionText(emotionText);
      } else if (lines.length === 1) {
        // 한 줄로 응답이 온 경우 처리
        const singleLine = lines[0];
        const emotionPattern = /[가-힣]+\s*\d+%/;
        const emotionMatch = singleLine.match(emotionPattern);

        if (emotionMatch) {
          const emotionStartIndex = singleLine.indexOf(emotionMatch[0]);
          if (emotionStartIndex > 0) {
            topicSummary = singleLine.substring(0, emotionStartIndex).trim();
            const emotionText = singleLine.substring(emotionStartIndex).trim();
            emotionAnalysis = this.parseEmotionText(emotionText);
          }
        }
      }

      // 검증 및 기본값 설정
      if (!topicSummary || topicSummary.length < 5) {
        topicSummary = '영상을 보며 즐거운 시간을 보냈네요!';
        console.warn('[AI Summary] 주제 요약 생성 실패, 기본값 사용');
      }

      if (emotionAnalysis.length === 0) {
        // 기본값 설정
        emotionAnalysis = [
          { emotion: '공감', percentage: 40 },
          { emotion: '기쁨', percentage: 30 },
          { emotion: '놀람', percentage: 20 },
          { emotion: '기타', percentage: 10 },
        ];
        console.warn('[AI Summary] 감정 분석 생성 실패, 기본값 사용');
      }

      return {
        topicSummary: topicSummary.substring(0, 200),
        emotionAnalysis,
      };
    } catch (error) {
      console.error('[AI Summary] Claude 모델 호출 실패:', error);

      // AI 호출 실패 시 기본 응답 반환
      return {
        topicSummary: '채팅 내용을 분석 중 오류가 발생했습니다.',
        emotionAnalysis: [{ emotion: '분석 불가', percentage: 100 }],
      };
    }
  }

  /**
   * 감정 텍스트를 구조화된 배열로 파싱
   * "기쁨 30%, 슬픔 20%, 분노 10%" -> [{emotion: "기쁨", percentage: 30}, ...]
   */
  private parseEmotionText(emotionText: string): EmotionItem[] {
    const emotionItems: EmotionItem[] = [];

    // 감정 키워드 정의
    const emotionKeywords = [
      '기쁨',
      '슬픔',
      '분노',
      '놀람',
      '감동',
      '공감',
      '공포',
      '좌절',
      '절망',
      '당황',
      '기타',
    ];

    // 정규식으로 "감정명 숫자%" 패턴 찾기
    const pattern = new RegExp(`(${emotionKeywords.join('|')})\\s*(\\d+)%`, 'g');
    let match;

    while ((match = pattern.exec(emotionText)) !== null) {
      emotionItems.push({
        emotion: match[1],
        percentage: parseInt(match[2], 10),
      });
    }

    // 백분율 합계 검증 및 보정
    const total = emotionItems.reduce((sum, item) => sum + item.percentage, 0);
    if (total !== 100 && emotionItems.length > 0) {
      // 마지막 항목으로 보정
      const diff = 100 - total;
      emotionItems[emotionItems.length - 1].percentage += diff;
    }

    // 내림차순 정렬
    emotionItems.sort((a, b) => b.percentage - a.percentage);

    return emotionItems;
  }

  /**
   * AI 요약에 대한 피드백을 저장합니다.
   * 기존 UserFeedback 테이블을 활용하여 JSON 형태로 저장합니다.
   */
  async submitFeedback(
    summaryId: string,
    userId: number,
    feedback: 'LIKE' | 'DISLIKE',
    comment?: string,
  ): Promise<void> {
    // summaryId에서 roomId 추출 (summary_123_timestamp 형식)
    const roomIdMatch = summaryId.match(/summary_(\d+)_/);
    if (!roomIdMatch) {
      throw new AppError('GENERAL_001', '유효하지 않은 summaryId입니다.');
    }

    const roomId = parseInt(roomIdMatch[1]);

    // 실제로 존재하는 방인지 확인
    const room = await prisma.room.findUnique({
      where: { roomId },
    });

    if (!room) {
      throw new AppError('ROOM_001', '방이 존재하지 않습니다.');
    }

    // UserFeedback 테이블에 AI 요약 피드백 저장
    const feedbackData: AISummaryFeedbackData = {
      type: 'AI_SUMMARY_FEEDBACK',
      summaryId,
      roomId,
      feedback,
      comment,
      timestamp: new Date().toISOString(),
    };

    await prisma.userFeedback.create({
      data: {
        userId,
        content: JSON.stringify(feedbackData),
      },
    });
  }
}

export const aiSummaryService = new AiSummaryService();
