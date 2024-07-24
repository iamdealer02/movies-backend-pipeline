import jwt, { JwtPayload } from 'jsonwebtoken';
import { unauthorized } from '../constants/statusCodes';
import logger from './winston';
import { Response, NextFunction } from 'express';
import {
  CustomRequest,
  DecodedToken,
} from '../interfaces/verifyToken.interface';

const verifyToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.header('Authorization');

  if (!token) {
    res.status(unauthorized).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET) as
      | string
      | JwtPayload;

    if (typeof decoded !== 'string' && 'user' in decoded) {
      req.user = (decoded as DecodedToken).user;
      next();
    } else {
      throw new Error('Invalid token');
    }
  } catch (error) {
    logger.error(error);
    res.status(unauthorized).json({ error: 'Invalid token' });
  }
};

export default verifyToken;
