import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/api/health', (_req: Request, res: Response) : Response => {
    return res.status(200).json({
        message: "All up and running !!",
      });
})

export default router;