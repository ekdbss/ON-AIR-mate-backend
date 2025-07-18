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
