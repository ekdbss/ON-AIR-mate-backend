import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_SERVER_ERROR'
) => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  };
  res.status(statusCode).json(response);
};
