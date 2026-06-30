import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { completed } = body;

    // Find task and verify ownership
    const task = await prisma.task.findUnique({
      where: { id },
      include: { list: true },
    });

    if (!task || task.list.userId !== userId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    if (completed) {
      await prisma.dailyAnalytics.upsert({
        where: {
          userId_date: {
            userId,
            date: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        update: {
          tasksCompleted: { increment: 1 },
          completionValue: { increment: 1 },
          updatedAt: new Date(),
        },
        create: {
          userId,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
          tasksCompleted: 1,
          tasksCreated: 0,
          completionRate: 0,
          completionValue: 1,
          averageCompletionTime: null,
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
