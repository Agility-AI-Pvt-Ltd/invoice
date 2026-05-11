import { NextResponse } from 'next/server';
import { logger } from './logger';

export type ErrorCode = 
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly status: number = 400,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ApiErrors = {
  BAD_REQUEST: (msg: string = 'Bad Request', details?: any) => new AppError('BAD_REQUEST', msg, 400, details),
  UNAUTHORIZED: (msg: string = 'Unauthorized') => new AppError('UNAUTHORIZED', msg, 401),
  FORBIDDEN: (msg: string = 'Forbidden') => new AppError('FORBIDDEN', msg, 403),
  NOT_FOUND: (msg: string = 'Resource Not Found') => new AppError('NOT_FOUND', msg, 404),
  METHOD_NOT_ALLOWED: (msg: string = 'Method Not Allowed') => new AppError('METHOD_NOT_ALLOWED', msg, 405),
  CONFLICT: (msg: string = 'Conflict') => new AppError('CONFLICT', msg, 409),
  UNPROCESSABLE_ENTITY: (msg: string = 'Validation Failed', details?: any) => new AppError('UNPROCESSABLE_ENTITY', msg, 422, details),
  RATE_LIMIT_EXCEEDED: (msg: string = 'Too Many Requests') => new AppError('RATE_LIMIT_EXCEEDED', msg, 429),
  INTERNAL_ERROR: (msg: string = 'Internal Server Error') => new AppError('INTERNAL_SERVER_ERROR', msg, 500),
};

export function handleApiError(error: unknown, context: string) {
  if (error instanceof AppError) {
    logger.warn(context, error.message, error, { code: error.code, status: error.status, details: error.details });
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status }
    );
  }

  logger.error(context, 'Unhandled API Error', error);
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'INTERNAL_SERVER_ERROR', 
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : String(error) 
      } 
    },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status: number = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}
