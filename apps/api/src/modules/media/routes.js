import { Router } from 'express';

export const mediaRouter = Router();

mediaRouter.post('/upload-url', (req, res) => {
  res.status(501).json({ code: 'NOT_IMPLEMENTED', message: 'Pre-signed upload flow in Phase 4' });
});

