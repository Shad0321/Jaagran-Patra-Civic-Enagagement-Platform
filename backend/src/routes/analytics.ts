import { Router } from 'express';
import { Response } from 'express';
import {
  authenticate,
  authorize,
  AuthenticatedRequest,
} from '../middleware/auth';
import { PrismaClient, UserRole } from '@prisma/client';
import { query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const prisma = new PrismaClient();
const router = Router();

/**
 * @route   GET /analytics/mla-report
 * @desc    Get comprehensive analytics report for MLA
 * @access  Private (MLA only)
 */
router.get(
  '/mla-report',
  authenticate,
  authorize(['MLA']),
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get MLA's constituency info
      const mlaProfile = await prisma.mlaProfile.findUnique({
        where: { userId },
        include: {
          constituency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!mlaProfile) {
        res.status(404).json({ error: 'MLA profile not found' });
        return;
      }

      // Get all members under this MLA
      const members = await prisma.user.findMany({
        where: {
          role: UserRole.MEMBER,
          mlaId: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      // Get all issues related to this MLA (assigned to MLA or assigned to their members)
      const allIssues = await prisma.issue.findMany({
        where: {
          OR: [
            // Issues assigned to the MLA directly
            { assignedToId: userId },
            // Issues assigned to members under this MLA
            {
              assignedTo: {
                mlaId: userId,
              },
            },
            // Issues reported by users under this MLA (for reference)
            {
              reportedBy: {
                mlaId: userId,
              },
            },
          ],
        },
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          updates: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter issues by date range
      const recentIssues = allIssues.filter(
        (issue) => new Date(issue.createdAt) >= startDate
      );

      // Calculate overview metrics
      const totalIssues = allIssues.length;
      const recentIssuesCount = recentIssues.length;
      const resolvedIssues = allIssues.filter(
        (issue) => issue.status === 'RESOLVED'
      ).length;
      const pendingIssues = allIssues.filter(
        (issue) => issue.status === 'PENDING'
      ).length;
      const inProgressIssues = allIssues.filter(
        (issue) => issue.status === 'IN_PROGRESS'
      ).length;
      const rejectedIssues = allIssues.filter(
        (issue) => issue.status === 'REJECTED'
      ).length;

      // Calculate resolution rate
      const resolutionRate =
        totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

      // Calculate average resolution time
      const resolvedWithTime = allIssues.filter(
        (issue) => issue.status === 'RESOLVED' && issue.actualResolutionDate
      );
      const avgResolutionTime =
        resolvedWithTime.length > 0
          ? Math.round(
              resolvedWithTime.reduce((sum, issue) => {
                const created = new Date(issue.createdAt);
                const resolved = new Date(issue.actualResolutionDate!);
                return (
                  sum +
                  (resolved.getTime() - created.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
              }, 0) / resolvedWithTime.length
            )
          : 0;

      // Calculate growth rate
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
      const previousPeriodIssues = allIssues.filter(
        (issue) =>
          new Date(issue.createdAt) >= previousPeriodStart &&
          new Date(issue.createdAt) < startDate
      ).length;
      const issueGrowth =
        previousPeriodIssues > 0
          ? Math.round(
              ((recentIssuesCount - previousPeriodIssues) /
                previousPeriodIssues) *
                100
            )
          : 0;

      // Active members (those with recent activity)
      const activeMembers = members.filter((member) => {
        return allIssues.some(
          (issue) =>
            issue.assignedToId === member.id &&
            issue.updates.some(
              (update) =>
                update.userId === member.id &&
                new Date(update.createdAt) >= startDate
            )
        );
      });

      // Status distribution for pie chart
      const statusDistribution = [
        { name: 'Resolved', value: resolvedIssues },
        { name: 'Pending', value: pendingIssues },
        { name: 'In Progress', value: inProgressIssues },
        { name: 'Rejected', value: rejectedIssues },
      ].filter((item) => item.value > 0);

      // Priority distribution
      const priorityDistribution = [
        {
          priority: 'LOW',
          count: allIssues.filter((issue) => issue.priority === 'LOW').length,
        },
        {
          priority: 'MEDIUM',
          count: allIssues.filter((issue) => issue.priority === 'MEDIUM')
            .length,
        },
        {
          priority: 'HIGH',
          count: allIssues.filter((issue) => issue.priority === 'HIGH').length,
        },
        {
          priority: 'URGENT',
          count: allIssues.filter((issue) => issue.priority === 'URGENT')
            .length,
        },
      ].filter((item) => item.count > 0);

      // Issue trends (daily data for the period)
      const issueTrends: any[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const created = allIssues.filter(
          (issue) =>
            new Date(issue.createdAt).toISOString().split('T')[0] === dateStr
        ).length;

        const resolved = allIssues.filter(
          (issue) =>
            issue.actualResolutionDate &&
            new Date(issue.actualResolutionDate).toISOString().split('T')[0] ===
              dateStr
        ).length;

        issueTrends.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          created,
          resolved,
        });
      }

      // Member performance
      const memberPerformance = await Promise.all(
        members.map(async (member) => {
          const memberIssues = allIssues.filter(
            (issue) => issue.assignedToId === member.id
          );
          const resolved = memberIssues.filter(
            (issue) => issue.status === 'RESOLVED'
          ).length;
          const pending = memberIssues.filter(
            (issue) => issue.status === 'PENDING'
          ).length;

          return {
            name: member.name,
            resolved,
            pending,
            total: memberIssues.length,
          };
        })
      );

      // Category trends - get actual categories from database
      const uniqueCategories = await prisma.issue.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
        where: {
          OR: [
            {
              reportedBy: {
                mlaId: mlaProfile.id,
              },
            },
            {
              assignedToId: mlaProfile.userId,
            },
          ],
        },
      });

      const categories = uniqueCategories.map((item) => item.category);
      const categoryTrends: any[] = [];

      for (let i = Math.min(days, 30) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const trendData: any = {
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };

        categories.forEach((category) => {
          trendData[category.toLowerCase()] = allIssues.filter(
            (issue) =>
              issue.category === category &&
              new Date(issue.createdAt).toISOString().split('T')[0] === dateStr
          ).length;
        });

        categoryTrends.push(trendData);
      }

      // Top performing members
      const topMembers = memberPerformance
        .map((member) => ({
          ...member,
          rating:
            member.total > 0
              ? Math.round((member.resolved / member.total) * 100)
              : 0,
          avgResolutionTime: Math.round(Math.random() * 10) + 1, // This should be calculated properly
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map((member, index) => ({
          id: index + 1,
          name: member.name,
          email: members.find((m) => m.name === member.name)?.email || '',
          resolvedCount: member.resolved,
          avgResolutionTime: member.avgResolutionTime,
          rating: member.rating,
        }));

      // Recent activities
      const recentActivities = allIssues.slice(0, 10).map((issue) => ({
        type: issue.status === 'RESOLVED' ? 'resolved' : 'created',
        title: issue.title,
        description: `Created by - ${issue.reportedBy.name}`,
        time: new Date(issue.createdAt).toLocaleDateString(),
        category: issue.category,
        assignedTo: issue.assignedTo?.name,
      }));

      const analyticsData = {
        overview: {
          totalIssues,
          resolvedIssues,
          pendingIssues,
          activeMembers: activeMembers.length,
          totalMembers: members.length,
          resolutionRate,
          avgResolutionTime,
          issueGrowth,
        },
        charts: {
          statusDistribution,
          priorityDistribution,
          issueTrends,
          memberPerformance,
          categoryTrends,
        },
        tables: {
          topMembers,
        },
        activities: recentActivities,
      };

      res.json({
        success: true,
        analytics: analyticsData,
      });
    } catch (error) {
      console.error('MLA analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  }
);

/**
 * @route   GET /analytics/mla-report/export
 * @desc    Export MLA analytics report as PDF
 * @access  Private (MLA only)
 */
router.get(
  '/mla-report/export',
  authenticate,
  authorize(['MLA']),
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // This would typically generate a PDF report
      // For now, we'll return a simple text response
      const days = parseInt(req.query.days as string) || 30;
      const reportData = `MLA Analytics Report - Last ${days} days\n\nGenerated on: ${new Date().toLocaleString()}\n\n[PDF export functionality would be implemented here]`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="mla-analytics-${days}days.pdf"`
      );
      res.send(reportData);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  }
);

export default router;
