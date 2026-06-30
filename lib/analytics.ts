import { prisma } from './prisma';

export interface AnalyticsData {
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number;
  completionValue: number;
  averageCompletionTime: number | null;
  categoryBreakdown: Record<string, number>;
  categoryPerformance: Record<string, number>;
  topCategories: string[];
}

export async function calculateDailyAnalytics(
  userId: string,
  date: Date
): Promise<AnalyticsData> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const tasksCreated = await prisma.task.count({
    where: {
      list: { userId },
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const completedTasks = await prisma.task.findMany({
    where: {
      list: { userId },
      completed: true,
      completedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      createdAt: true,
      completedAt: true,
      category: true,
      list: { select: { name: true } },
    },
  });

  const tasksCompleted = completedTasks.length;
  const completionRate =
    tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
  const completionValue = tasksCompleted * 1.5;

  let totalTime = 0;
  completedTasks.forEach((task: any) => {
    if (task.completedAt && task.createdAt) {
      const time =
        (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60);
      totalTime += time;
    }
  });

  const averageCompletionTime =
    tasksCompleted > 0 ? Math.round(totalTime / tasksCompleted) : null;

  const categoryBreakdown: Record<string, number> = {};
  const categoryPerformance: Record<string, number> = {};
  completedTasks.forEach((task: any) => {
    const category = task.category || 'productivity';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    categoryPerformance[category] = (categoryPerformance[category] || 0) + 1;
  });

  return {
    tasksCompleted,
    tasksCreated,
    completionRate: Math.round(completionRate * 100) / 100,
    completionValue,
    averageCompletionTime,
    categoryBreakdown,
    categoryPerformance,
    topCategories: Object.keys(categoryBreakdown).sort((a, b) => categoryBreakdown[b] - categoryBreakdown[a]).slice(0, 5),
  };
}

export async function calculateWeeklyAnalytics(
  userId: string,
  startDate: Date
): Promise<AnalyticsData & { productivity: string }> {
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const tasksCreated = await prisma.task.count({
    where: {
      list: { userId },
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
  });

  const completedTasks = await prisma.task.findMany({
    where: {
      list: { userId },
      completed: true,
      completedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    select: {
      createdAt: true,
      completedAt: true,
      category: true,
      list: { select: { name: true } },
    },
  });

  const tasksCompleted = completedTasks.length;
  const completionRate =
    tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
  const completionValue = tasksCompleted * 1.5;

  let totalTime = 0;
  completedTasks.forEach((task: any) => {
    if (task.completedAt && task.createdAt) {
      const time =
        (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60);
      totalTime += time;
    }
  });

  const averageCompletionTime =
    tasksCompleted > 0 ? Math.round(totalTime / tasksCompleted) : null;

  const categoryBreakdown: Record<string, number> = {};
  const categoryPerformance: Record<string, number> = {};
  completedTasks.forEach((task: any) => {
    const category = task.category || 'productivity';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    categoryPerformance[category] = (categoryPerformance[category] || 0) + 1;
  });

  let productivity = 'Medium';
  if (completionRate > 70) productivity = 'High';
  else if (completionRate < 30) productivity = 'Low';

  return {
    tasksCompleted,
    tasksCreated,
    completionRate: Math.round(completionRate * 100) / 100,
    completionValue,
    averageCompletionTime,
    categoryBreakdown,
    categoryPerformance,
    topCategories: Object.keys(categoryBreakdown).sort((a, b) => categoryBreakdown[b] - categoryBreakdown[a]).slice(0, 5),
    productivity,
  };
}

export async function calculateMonthlyAnalytics(
  userId: string,
  date: Date
): Promise<AnalyticsData & { productivity: string }> {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const tasksCreated = await prisma.task.count({
    where: {
      list: { userId },
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const completedTasks = await prisma.task.findMany({
    where: {
      list: { userId },
      completed: true,
      completedAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      createdAt: true,
      completedAt: true,
      category: true,
      list: { select: { name: true } },
    },
  });

  const tasksCompleted = completedTasks.length;
  const completionRate =
    tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
  const completionValue = tasksCompleted * 1.5;

  let totalTime = 0;
  completedTasks.forEach((task: any) => {
    if (task.completedAt && task.createdAt) {
      const time =
        (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60);
      totalTime += time;
    }
  });

  const averageCompletionTime =
    tasksCompleted > 0 ? Math.round(totalTime / tasksCompleted) : null;

  const categoryBreakdown: Record<string, number> = {};
  const categoryPerformance: Record<string, number> = {};
  completedTasks.forEach((task: any) => {
    const category = task.category || 'productivity';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    categoryPerformance[category] = (categoryPerformance[category] || 0) + 1;
  });

  let productivity = 'Medium';
  if (completionRate > 70) productivity = 'High';
  else if (completionRate < 30) productivity = 'Low';

  return {
    tasksCompleted,
    tasksCreated,
    completionRate: Math.round(completionRate * 100) / 100,
    completionValue,
    averageCompletionTime,
    categoryBreakdown,
    categoryPerformance,
    topCategories: Object.keys(categoryBreakdown).sort((a, b) => categoryBreakdown[b] - categoryBreakdown[a]).slice(0, 5),
    productivity,
  };
}

export async function storeAnalytics(
  userId: string,
  timeframe: 'daily' | 'weekly' | 'monthly',
  date: Date,
  analytics: AnalyticsData & { productivity?: string }
): Promise<void> {
  if (timeframe === 'daily') {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    await prisma.dailyAnalytics.upsert({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
      update: {
        tasksCompleted: analytics.tasksCompleted,
        tasksCreated: analytics.tasksCreated,
        completionRate: analytics.completionRate,
        completionValue: analytics.completionValue || 0,
        averageCompletionTime: analytics.averageCompletionTime,
        updatedAt: new Date(),
      },
      create: {
        userId,
        date: dateOnly,
        tasksCompleted: analytics.tasksCompleted,
        tasksCreated: analytics.tasksCreated,
        completionRate: analytics.completionRate,
        completionValue: analytics.completionValue || 0,
        averageCompletionTime: analytics.averageCompletionTime,
      },
    });
  } else if (timeframe === 'weekly') {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    await prisma.weeklyAnalytics.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart: weekStart,
        },
      },
      update: {
        tasksCompleted: analytics.tasksCompleted,
        tasksCreated: analytics.tasksCreated,
        completionRate: analytics.completionRate,
        averageCompletionTime: analytics.averageCompletionTime,
        topCategories: Object.keys(analytics.categoryBreakdown).slice(0, 5),
        productivity: analytics.productivity || 'Medium',
        updatedAt: new Date(),
      },
      create: {
        userId,
        weekStart,
        weekEnd,
        tasksCompleted: analytics.tasksCompleted,
        tasksCreated: analytics.tasksCreated,
        completionRate: analytics.completionRate,
        averageCompletionTime: analytics.averageCompletionTime,
        topCategories: Object.keys(analytics.categoryBreakdown).slice(0, 5),
        productivity: analytics.productivity || 'Medium',
      },
    });
  } else if (timeframe === 'monthly') {
    await prisma.monthlyAnalytics.upsert({
      where: {
        userId_year_month: {
          userId,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        },
      },
      update: {
        tasksCompleted: analytics.tasksCompleted,
        tasksCreated: analytics.tasksCreated,
        completionRate: analytics.completionRate,
        averageCompletionTime: analytics.averageCompletionTime,
        topCategories: Object.keys(analytics.categoryBreakdown).slice(0, 5),
        productivity: analytics.productivity || 'Medium',
        updatedAt: new Date(),
      },
      create: {
        userId,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        tasksCompleted: analytics.tasksCompleted,
        tasksCreated: analytics.tasksCreated,
        completionRate: analytics.completionRate,
        averageCompletionTime: analytics.averageCompletionTime,
        topCategories: Object.keys(analytics.categoryBreakdown).slice(0, 5),
        productivity: analytics.productivity || 'Medium',
      },
    });
  }
}
