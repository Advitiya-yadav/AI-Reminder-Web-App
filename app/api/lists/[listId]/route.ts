import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/prisma'
import { ensureDailyTaskReset } from '@/lib/taskReset'

function getUserIdFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string
      email: string
    }

    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { listId } = await params

    const list = await prisma.list.findUnique({
      where: {
        id: listId,
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    const isOwner = list.userId === userId;
    if (!isOwner) {
      const collaborator = await prisma.listPermission.findFirst({
        where: {
          listId,
          friendId: userId,
        },
      });

      if (!collaborator) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    await ensureDailyTaskReset(list.userId, new Date());

    const tasks = await prisma.task.findMany({
      where: {
        listId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Derive date/time and include reminderOffset for frontend
    const annotated = tasks.map((t) => {
      let date = null
      let time = null
      if (t.dueDate) {
        const d = new Date(t.dueDate as any)
        date = d.toISOString().split('T')[0]
        time = d.toTimeString().slice(0,5)
      }
      return {
        ...t,
        date,
        time,
        reminderOffset: (t as any).reminderOffset ?? null,
      }
    })

    return NextResponse.json(annotated)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
