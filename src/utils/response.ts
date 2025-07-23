import { Response } from 'express';

interface IResponse<T> {
  success: boolean;
  data: T | null;
  error: IError | null;
}

interface IError {
  code: string;
  message: string;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const response: IResponse<T> = { success: true, data, error: null };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_SERVER_ERROR',
) => {
  const response: IResponse<null> = { success: false, data: null, error: { code, message } };
  res.status(statusCode).json(response);
};
