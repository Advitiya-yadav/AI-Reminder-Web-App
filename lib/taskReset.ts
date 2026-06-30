import { prisma } from './prisma';
import { calculateDailyAnalytics } from './analytics';

export async function ensureDailyTaskReset(userId: string, now: Date = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const previousDay = new Date(startOfToday);
  previousDay.setDate(previousDay.getDate() - 1);

  const staleTasks = await prisma.task.findMany({
    where: {
      list: { userId },
      createdAt: {
        lt: startOfToday,
      },
    },
    select: {
      id: true,
    },
  });

  if (staleTasks.length === 0) {
    return false;
  }

  const analytics = await calculateDailyAnalytics(userId, previousDay);

  await prisma.dailyAnalytics.upsert({
    where: {
      userId_date: {
        userId,
        date: previousDay,
      },
    },
    update: {
      tasksCompleted: analytics.tasksCompleted,
      tasksCreated: analytics.tasksCreated,
      completionRate: analytics.completionRate,
      completionValue: analytics.tasksCompleted,
      averageCompletionTime: analytics.averageCompletionTime,
      updatedAt: new Date(),
    },
    create: {
      userId,
      date: previousDay,
      tasksCompleted: analytics.tasksCompleted,
      tasksCreated: analytics.tasksCreated,
      completionRate: analytics.completionRate,
      completionValue: analytics.tasksCompleted,
      averageCompletionTime: analytics.averageCompletionTime,
    },
  });

  await prisma.task.deleteMany({
    where: {
      list: { userId },
      createdAt: {
        lt: startOfToday,
      },
    },
  });

  return true;
}
