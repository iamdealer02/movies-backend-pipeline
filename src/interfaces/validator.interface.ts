import { Request } from 'express';

export interface CustomRequest extends Request {
  body: {
    creation_date: string;
    [key: string]: string | null;
  };
}
