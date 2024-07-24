import * as statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';
import { Request, Response } from 'express';
import pg, { QueryResult } from 'pg';
import { IPgUser } from 'src/interfaces/pgUser.interface';
import jwt from 'jsonwebtoken';

const registerUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, username, password, country, city, street, creation_date } =
    req.body as IPgUser;

  if (!email || !username || !password || !country) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'Missing parameters' });
  } else {
    const client: pg.PoolClient = await pool.connect();
    try {
      const result: QueryResult = await client.query(
        'SELECT * FROM users WHERE email = $1;',
        [email],
      );

      if (result.rowCount) {
        return res
          .status(statusCodes.userAlreadyExists)
          .json({ message: 'User already has an account' });
      } else {
        await client.query('BEGIN');

        const addedUser = await client.query(
          `INSERT INTO users(email, username, password, creation_date)
                    VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
          [email, username, password, creation_date],
        );

        logger.info('USER ADDED', addedUser.rowCount);

        const address = await client.query(
          `INSERT INTO addresses(email, country, street, city)
                    VALUES ($1, $2, $3, $4);`,
          [email, country, street, city],
        );

        logger.info('ADDRESS ADDED', address.rowCount);
        res.status(statusCodes.success).json({ message: 'User created' });
        await client.query('COMMIT');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(error.stack);
      res.status(statusCodes.queryError).json({
        message: 'Exception occurred while registering',
      });
    } finally {
      client.release();
    }
  }
};

const login = async (
  req: Request & { session: { user?: { email: string } } },
  res: Response,
): Promise<Response> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'Missing parameters' });
  } else {
    pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
      [email, password],
      (err, rows) => {
        if (err) {
          logger.error(err.stack);
          return res
            .status(statusCodes.queryError)
            .json({ error: 'Exception occurred while logging in' });
        } else {
          if (rows.rows[0]) {
            req.session.user = {
              email: rows.rows[0].email,
            };

            const token = jwt.sign(
              { user: { email: rows.rows[0].email } },
              process.env.JWT_SECRET,
              {
                expiresIn: '1h',
              },
            );
            return res
              .status(statusCodes.success)
              .json({ token, username: rows.rows[0].username });
          } else {
            return res
              .status(statusCodes.notFound)
              .json({ message: 'Incorrect email/password' });
          }
        }
      },
    );
  }
};

export { registerUser, login };
