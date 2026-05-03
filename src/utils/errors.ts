export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export const Unauthorized = (message = 'Unauthorized') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const NotFound = (message = 'Not Found') =>
  new AppError(404, 'NOT_FOUND', message);

export const BadRequest = (message = 'Bad Request') =>
  new AppError(400, 'BAD_REQUEST', message);
