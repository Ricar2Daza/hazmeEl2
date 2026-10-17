export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    this.statusCode = statusCode;
    this.isOperational = statusCode < 500;
    Error.captureStackTrace(this, this.constructor);
  }
}
