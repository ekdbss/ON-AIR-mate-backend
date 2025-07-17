import swaggerJsdoc from 'swagger-jsdoc';

// 환경별 서버 URL 설정
const getServerUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'http://15.164.176.168:3000';
  }
  return 'http://localhost:3000';
};

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
        url: getServerUrl(),
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'], // API 명세가 작성된 파일 경로
};

export const specs = swaggerJsdoc(options);
