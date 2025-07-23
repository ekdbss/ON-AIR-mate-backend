import swaggerJsdoc from 'swagger-jsdoc';
const hostUrl =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://54.180.254.48:3000'; // 환경변수로 관리

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ON-AIR-mate API',
      version: '1.0.0',
      description: 'ON-AIR-mate API with Swagger',
    },
    servers: [
      {
        url: hostUrl,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
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
