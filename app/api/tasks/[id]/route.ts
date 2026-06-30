import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/prisma'
import { normalizeTaskCategory } from '@/lib/taskCategory'

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        list: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.list.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (typeof body.title === 'string') {
      updateData.title = body.title
    }

    if (typeof body.description === 'string') {
      updateData.description = body.description
    }

    if (typeof body.priority === 'string') {
      updateData.priority = body.priority
    }

    if (typeof body.category === 'string') {
      updateData.category = normalizeTaskCategory(body.category)
    }

    if (typeof body.completed === 'boolean') {
      updateData.completed = body.completed
      updateData.completedAt = body.completed ? new Date() : null
    }

    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate)
    }

    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: updateData,
    })

    return NextResponse.json({
      ...updatedTask,
      date: body.date ?? null,
      time: body.time ?? null,
      reminderOffset: body.reminderOffset ?? null,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        list: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.list.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.task.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}