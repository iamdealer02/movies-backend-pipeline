import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';
import { Request, Response } from 'express';
import { UserProfile } from 'src/interfaces/profile.interface';
import session from 'express-session';

interface CustomRequest extends Request {
  user: UserProfile;
}

interface CustomSession extends session.Session {
  user?: UserProfile;
}

const editPassword = async (
  req: CustomRequest,
  res: Response,
): Promise<void> => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  } else {
    if (oldPassword === newPassword) {
      res
        .status(statusCodes.badRequest)
        .json({ message: 'New password cannot be equal to old password' });
    } else {
      pool.query(
        'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
        [req.user.email, oldPassword],
        (err, result) => {
          if (err) {
            logger.error(err.stack);
            res
              .status(statusCodes.queryError)
              .json({ error: 'Exception occurred while updating password' });
          } else {
            if (result.rows[0]) {
              pool.query(
                "UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE email = $2;",
                [newPassword, req.user.email],
                (err) => {
                  if (err) {
                    logger.error(err.stack);
                    res.status(statusCodes.queryError).json({
                      error: 'Exception occurred while updating password',
                    });
                  } else {
                    res
                      .status(statusCodes.success)
                      .json({ message: 'Password updated' });
                  }
                },
              );
            } else {
              res
                .status(statusCodes.badRequest)
                .json({ message: 'Incorrect password' });
            }
          }
        },
      );
    }
  }
};

const logout = async (req: Request, res: Response): Promise<Response> => {
  const session = req.session as CustomSession;

  if (session.user) {
    delete session.user;
  }

  return res.status(200).json({ message: 'Disconnected' });
};

export { editPassword, logout };
