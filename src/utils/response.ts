import { Response } from 'express';

interface IResponse<T> {
  success: boolean;
  data: T | null;
  error: IError | null;
  timestamp: string;
}

interface IError {
  code: string;
  message: string;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const response: IResponse<T> = {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code: string = 'GENERAL_004',
) => {
  const response: IResponse<null> = {
    success: false,
    data: null,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};
