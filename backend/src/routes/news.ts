import { Router } from 'express';
import {
  getPublicNews,
  getNewsById,
  getNewsCategories,
  getLatestNews,
} from '../controllers/newsController';

const router = Router();

// Public news routes (no authentication required)
router.get('/', getPublicNews);
router.get('/latest', getLatestNews);
router.get('/categories', getNewsCategories);
router.get('/:id', getNewsById);

export default router;
