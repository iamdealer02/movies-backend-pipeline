import { Request, Response } from 'express';

const notFoundMiddleware = (_req: Request, res: Response): void => {
  const err = new Error('Not Found');
  res.status(404).json({
    error: {
      message: err.message,
    },
  });
};

export default notFoundMiddleware;
