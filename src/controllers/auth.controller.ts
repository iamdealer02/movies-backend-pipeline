import { User } from '../models/users.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser } from '../interfaces/user.interface';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import logger from '../middleware/winston';

export const signIn = async (
  req: Request & { session: { user: { _id: Types.ObjectId } } },
  res: Response,
): Promise<Response> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = (await User.findOne({ email })) as IUser | null;

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Email or password don't match" });
    }

    req.session.user = {
      _id: user._id,
    };

    const token = jwt.sign(
      { user: { _id: user._id, email: user.email } },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );

    return res.status(200).json({ token });
  } catch (err) {
    logger.error(err.stack);
    return res.status(500).json({ error: 'Server error' });
  }
};