import { Router } from 'express';

export const contentRouter = Router();

contentRouter.get('/stories', (req, res) => {
  res.json([
    {
      id: 'story-1',
      title: 'A Historic Walk in London',
      summary: 'Exploring historic landmarks across the river.',
      coverUrl: null
    }
  ]);
});

