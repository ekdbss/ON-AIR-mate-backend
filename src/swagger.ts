import swaggerJsdoc from 'swagger-jsdoc';
const hostUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000' // 개발: HTTP
    : 'https://onairmate.duckdns.org';

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
        GetCollectionDto: {
          type: 'object',
          properties: {
            collectionId: { type: 'integer', example: 123 },
            title: { type: 'string', example: '컬렉션 제목' },
            description: { type: 'string', example: '컬렉션 소개' },
            bookmarkCount: { type: 'integer', example: 5 },
            visibility: {
              type: 'string',
              enum: ['public', 'friends', 'private'],
              example: 'private',
            },
            coverImage: { type: 'string', nullable: true, example: '커버이미지URL' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        GetCollectionDetailDto: {
          type: 'object',
          properties: {
            collectionId: { type: 'integer', example: 123 },
            title: { type: 'string', example: '컬렉션 제목' },
            description: { type: 'string', example: '컬렉션 소개' },
            bookmarkCount: { type: 'integer', example: 5 },
            visibility: {
              type: 'string',
              enum: ['public', 'friends', 'private'],
              example: 'private',
            },
            coverImage: { type: 'string', nullable: true, example: '커버이미지URL' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            bookmarks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bookmarkId: { type: 'integer', example: 456 },
                  videoTitle: { type: 'string', example: '비디오 제목' },
                  videoThumbnail: { type: 'string', example: '비디오 썸네일 URL' },
                  roomTitle: { type: 'string', example: '방 제목' },
                  message: { type: 'string', example: '북마크 메시지' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        CreateCollectionDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '컬렉션 제목',
              example: '나의 플레이리스트',
            },
            description: {
              type: 'string',
              description: '컬렉션에 대한 간단한 소개(100자 이내)',
              example: '신나는 노래 모음',
            },
            visibility: {
              type: 'string',
              enum: ['private', 'friends', 'public'],
              description: '공개 범위',
              example: 'public',
            },
          },
          required: ['title', 'visibility'],
        },
        ActiveRoom: {
          type: 'object',
          description:
            '활성화된 방 목록 - continueWatching: 이전에 참여했고 활성화된 방 / onAirRooms: 현재 활성화된 방',
          properties: {
            roomId: { type: 'number', example: 123 },
            roomTitle: { type: 'string', example: '같이 최신 영화 볼 사람' },
            videoTitle: { type: 'string', example: '케이팝 데몬 헌터스' },
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
              example: 'IU - Never Ending Story (Official Music Video)',
            },
            thumbnail: {
              type: 'string',
              example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
            },
            channelName: { type: 'string', example: 'IU' },
            viewCount: { type: 'integer', example: 1000000000 },
            uploadTime: { type: 'string', format: 'date-time', example: '2025-04-25T06:57:33Z' },
            duration: { type: 'string', example: '03:33' },
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
