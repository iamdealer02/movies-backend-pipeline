import logger from './winston';
import { badRequest } from 'src/constants/statusCodes';
import { Response, NextFunction } from 'express';
import { CustomRequest } from 'src/interfaces/validator.interface';

export const validator = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.body.creation_date) {
    delete req.body.creation_date;
  }

  const CreationDate: string = new Date().toJSON().slice(0, 10);
  req.body.creation_date = CreationDate;

  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (value === '') {
        req.body[key] = value;
        continue;
      }
    }
    next();
  } catch (error) {
    logger.error(error);
    res.status(badRequest).send({ error: error.message });
  }
};
