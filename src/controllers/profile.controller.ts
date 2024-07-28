import { Request, Response } from 'express';
import { UserProfile } from 'src/interfaces/profile.interface';
import session from 'express-session';

interface CustomSession extends session.Session {
  user?: UserProfile;
}

const logout = async (req: Request, res: Response): Promise<Response> => {
  const session = req.session as CustomSession;

  if (session.user) {
    delete session.user;
  }

  return res.status(200).json({ message: 'Disconnected' });
};

export { logout };
