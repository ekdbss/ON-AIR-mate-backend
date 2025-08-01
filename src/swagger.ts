import swaggerJsdoc from 'swagger-jsdoc';
const hostUrl =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://54.180.254.48:3000'; // 환경변수로 관리

const isProduction = process.env.NODE_ENV === 'production';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ON-AIR-mate API',
      version: '1.0.0',
      description: isProduction
        ? 'ON-AIR-mate API with Swagger'
        : `ON-AIR-mate API with Swagger\n\n` +
          ` **테스트 모드 활성화**\n` +
          `- 인증이 필요한 API도 토큰 없이 테스트 가능합니다\n` +
          `- 테스트 사용자(userId: 1)로 자동 인증됩니다\n` +
          `- 실제 서비스에서는 정상적인 인증이 필요합니다`,
    },
    servers: [
      {
        url: hostUrl,
        description: isProduction ? 'Production Server' : 'Development/Test Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: isProduction
            ? '인증 토큰 필요'
            : '개발 환경: 토큰 없이도 테스트 가능 (자동 인증)',
        },
      },
      schemas: {
        ActiveRoom: {
          type: 'object',
          properties: {
            roomId: { type: 'number', example: 123 },
            roomTitle: { type: 'string', example: '같이 명작 영화 봐요' },
            videoTitle: { type: 'string', example: '쇼생크 탈출' },
            videoThumbnail: { type: 'string', example: 'https://thumbnail.url/image.jpg' },
            hostNickname: { type: 'string', example: '영화광' },
            hostProfileImage: { type: 'string', example: 'https://profile.url/image.png' },
            hostPopularity: { type: 'number', example: 95 },
            currentParticipants: { type: 'number', example: 5 },
            maxParticipants: { type: 'number', example: 8 },
            duration: { type: 'string', example: '01:23:45' },
            isPrivate: { type: 'boolean', example: false },
          },
        },
        ActiveRoomsData: {
          type: 'object',
          properties: {
            continueWatching: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActiveRoom' },
            },
            onAirRooms: {
              type: 'array',
              items: { $ref: '#/components/schemas/ActiveRoom' },
            },
          },
        },
        ActiveRoomsResponse: {
          allOf: [
            { $ref: '#/components/schemas/SuccessResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  $ref: '#/components/schemas/ActiveRoomsData',
                },
              },
            },
          ],
        },
        RecommendedVideo: {
          type: 'object',
          properties: {
            videoId: { type: 'string', example: 'dQw4w9WgXcQ' },
            title: {
              type: 'string',
              example: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
            },
            thumbnail: {
              type: 'string',
              example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
            },
            channelName: { type: 'string', example: 'Rick Astley' },
            viewCount: { type: 'integer', example: 1000000000 },
            uploadTime: { type: 'string', format: 'date-time', example: '2009-10-25T06:57:33Z' },
            duration: { type: 'string', example: 'PT3M33S' },
            durationFormatted: { type: 'string', example: '03:33' },
          },
        },
        RoomInfoResponse: {
          type: 'object',
          properties: {
            roomId: { type: 'integer', example: 123 },
            roomTitle: { type: 'string', example: '방제목' },
            videoId: { type: 'string', example: 'dQw4w9WgXcQ' },
            videoTitle: { type: 'string', example: '영상제목' },
            videoThumbnail: { type: 'string', example: '썸네일URL' },
            hostNickname: { type: 'string', example: '방장닉네임' },
            hostProfileImage: { type: 'string', example: '방장프로필URL' },
            hostPopularity: { type: 'integer', example: 95 },
            currentParticipants: { type: 'integer', example: 5 },
            maxParticipants: { type: 'integer', example: 8 },
            duration: { type: 'string', example: 'PT1M23S' },
            isPrivate: { type: 'boolean', example: false },
            isActive: { type: 'boolean', example: true },
            autoArchiving: { type: 'boolean', example: true },
            invitePermission: { type: 'string', example: 'all' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T12:00:00Z' },
          },
        },
        RoomInfoSuccessResponse: {
          allOf: [
            { $ref: '#/components/schemas/SuccessResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  $ref: '#/components/schemas/RoomInfoResponse',
                },
              },
            },
          ],
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            error: {
              type: 'object',
              nullable: true,
              example: null,
            },
          },
        },
        RecommendationResponse: {
          allOf: [
            { $ref: '#/components/schemas/SuccessResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RecommendedVideo' },
                },
              },
            },
          ],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'], // API 명세가 작성된 파일 경로
};

export const specs = swaggerJsdoc(options);
