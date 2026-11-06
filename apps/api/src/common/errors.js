export class AppError extends Error {
  constructor(code, message, status = 400, details = null) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const response = {
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: err.details || null
  };

  if (process.env.NODE_ENV !== 'production' && !err.code) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

