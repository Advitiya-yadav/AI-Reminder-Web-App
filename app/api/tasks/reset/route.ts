import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

function getUserIdFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const staleTasks = await prisma.task.findMany({
      where: {
        list: { userId },
        createdAt: { lt: startOfToday },
      },
      select: { id: true },
    });

    if (staleTasks.length > 0) {
      await prisma.task.deleteMany({
        where: {
          list: { userId },
          createdAt: { lt: startOfToday },
        },
      });
    }

    return NextResponse.json({ message: 'Daily task reset checked.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reset tasks' }, { status: 500 });
  }
}
