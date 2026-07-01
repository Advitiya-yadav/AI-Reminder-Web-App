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

    // allow owner OR collaborator with canEdit permission
    if (task.list.userId !== userId) {
      const perm = await prisma.listPermission.findFirst({
        where: { listId: task.listId, friendId: userId, canEdit: true },
      });
      if (!perm) {
        return NextResponse.json(
          { error: 'Forbidden: you are not allowed to edit this task' },
          { status: 403 }
        )
      }
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
      // allow explicit completedAt value (user provided) or use now when marking complete
      if (body.completedAt) {
        updateData.completedAt = new Date(body.completedAt)
      } else {
        updateData.completedAt = body.completed ? new Date() : null
      }
    }

    // Support setting due date via separate date/time fields from the client
    if (body.date || body.time || body.dueDate) {
      try {
        if (body.dueDate) {
          updateData.dueDate = new Date(body.dueDate)
        } else {
          const datePart = body.date || null
          const timePart = body.time || '00:00'
          if (datePart) {
            updateData.dueDate = new Date(`${datePart}T${timePart}`)
          }
        }
      } catch (err) {
        console.warn('Invalid date/time provided for dueDate', err)
      }
    }

    // persist reminder offset string (e.g., '5m', '1h', '1d')
    if (body.reminderOffset !== undefined) {
      if (body.reminderOffset === null) {
        updateData.reminderOffset = null
      } else if (typeof body.reminderOffset === 'string') {
        updateData.reminderOffset = body.reminderOffset.trim() === '' ? null : body.reminderOffset.trim()
      } else {
        return NextResponse.json({ error: 'Invalid reminderOffset value' }, { status: 400 })
      }
    }

    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: updateData,
    })

    // derive date/time strings from dueDate if available for frontend convenience
    let dateStr = null
    let timeStr = null
    if (updatedTask.dueDate) {
      const d = new Date(updatedTask.dueDate as any)
      dateStr = d.toISOString().split('T')[0]
      timeStr = d.toTimeString().slice(0,5)
    }

    return NextResponse.json({
      ...updatedTask,
      date: dateStr,
      time: timeStr,
      reminderOffset: (updatedTask as any).reminderOffset ?? null,
    })
  } catch (error) {
    console.error('Task PATCH error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update task'
    return NextResponse.json(
      { error: message },
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