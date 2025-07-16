import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/validation';

const prisma = new PrismaClient();

// Get public news (active news only)
export const getPublicNews = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, state, category, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Build OR conditions array
    const orConditions: any[] = [];

    // Filter by state or national news
    if (state && state !== 'all') {
      // If specific state is requested, show that state's news AND national news
      orConditions.push({ stateId: state as string });
      orConditions.push({ isNational: true });

      // Add OR conditions to where clause
      where.OR = orConditions;
    }
    // If no state specified, show ALL news (don't add any state/national filters)

    // Filter by category (this should be AND, not OR)
    if (category && category !== 'all') {
      where.category = category as string;
    }

    // Search functionality (this will override the OR clause above, so we need to handle it differently)
    if (search) {
      const searchConditions = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } },
      ];

      // If we had state/location filters, we need to combine them properly
      if (orConditions.length > 0) {
        where.AND = [{ OR: orConditions }, { OR: searchConditions }];
        delete where.OR; // Remove the simple OR since we're using AND now
      } else {
        where.OR = searchConditions;
      }
    }

    try {
      const [news, total] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
          skip: offset,
          take: limitNum,
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
            state: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        }),
        prisma.news.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          news,
          pagination: {
            current: pageNum,
            total: totalPages,
            totalItems: total,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching public news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch news',
      });
    }
  }
);

// Get single news by ID
export const getNewsById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const news = await prisma.news.findFirst({
        where: {
          id,
          isActive: true,
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          state: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (!news) {
        res.status(404).json({
          success: false,
          message: 'News not found',
        });
        return;
      }

      // Increment view count
      await prisma.news.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      res.json({
        success: true,
        data: news,
      });
    } catch (error) {
      console.error('Error fetching news by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch news',
      });
    }
  }
);

// Get news categories (for filters)
export const getNewsCategories = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const categories = await prisma.news.groupBy({
        by: ['category'],
        where: {
          isActive: true,
          category: { not: null },
        },
        _count: {
          category: true,
        },
      });

      res.json({
        success: true,
        data: categories.map((cat) => ({
          category: cat.category,
          count: cat._count.category,
        })),
      });
    } catch (error) {
      console.error('Error fetching news categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
      });
    }
  }
);

// Get latest news for dashboard widget (limited to 5 items)
export const getLatestNews = asyncHandler(
  async (req: Request, res: Response) => {
    const { state } = req.query;

    const where: any = {
      isActive: true,
    };

    // Show state-specific and national news
    if (state && state !== 'all') {
      where.OR = [{ stateId: state as string }, { isNational: true }];
    } else {
      // Show national news AND news without state restriction
      where.OR = [{ isNational: true }, { stateId: null }];
    }

    try {
      const news = await prisma.news.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          publishedAt: true,
          isPinned: true,
          isNational: true,
          state: {
            select: {
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: news,
      });
    } catch (error) {
      console.error('Error fetching latest news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latest news',
      });
    }
  }
);
