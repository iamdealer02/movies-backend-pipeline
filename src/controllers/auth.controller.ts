import { User } from '../models/users.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser } from '../interfaces/user.interface';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import logger from '../middleware/winston';
import { HydratedDocument } from 'mongoose';

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

export const signUp = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'missing information' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const newUser: HydratedDocument<IUser> = new User({
      username,
      email,
      password: hash,
    });
    const user = await newUser.save();
    return res.status(201).json(user);
  } catch (err) {
    logger.error(err.stack);
    return res.status(500).json({ message: 'failed to save user' });
  }
};

export const getUser = async (
  req: Request & { session: { user: { _id: Types.ObjectId } } },
  res: Response,
): Promise<Response> => {
  if (!req.session.user) {
    return res.status(500).json({ error: 'You are not authenticated' });
  }
  try {
    const user: HydratedDocument<IUser> = await User.findById(
      req.session.user._id,
      {
        password: 0,
      },
    );
    // populate it with messages after we have message model
    // .populate('messages')

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get user' });
  }
};
