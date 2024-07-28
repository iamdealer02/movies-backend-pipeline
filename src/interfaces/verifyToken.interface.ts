import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

interface User {
  email: string;
}

interface DecodedToken extends JwtPayload {
  user: User;
}

interface CustomRequest extends Request {
  user?: User;
}

export { User, DecodedToken, CustomRequest };
