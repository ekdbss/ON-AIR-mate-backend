
import swaggerJsdoc from 'swagger-jsdoc';

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
        url: 'http://localhost:3000', // 요청 URL
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'], // API 명세가 작성된 파일 경로
};

export const specs = swaggerJsdoc(options);
