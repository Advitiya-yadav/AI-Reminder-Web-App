import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { inferTaskCategory, normalizeTaskCategory } from '@/lib/taskCategory'

function getUserIdFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return decoded.userId
  } catch (error) {
    console.error('Invalid auth token:', error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()

    const title = formData.get('title') as string | null
    const listId = formData.get('contextId') as string | null
    const rawCategory = formData.get('category') as string | null
    const description = formData.get('description') as string | null
    const dueDateRaw = formData.get('dueDate') as string | null
    const reminderOffset = formData.get('reminderOffset') as string | null

    if (!title || !listId) {
      return NextResponse.json(
        { error: 'Title and listId are required' },
        { status: 400 }
      )
    }

    const list = await prisma.list.findUnique({ where: { id: listId } })
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    let canAddTask = list.userId === userId
    if (!canAddTask) {
      const permission = await prisma.listPermission.findFirst({
        where: {
          listId,
          friendId: userId,
          canAdd: true,
        },
      })
      canAddTask = Boolean(permission)
    }

    if (!canAddTask) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const category = normalizeTaskCategory(rawCategory || inferTaskCategory(title, description || ''))

    const createData: any = {
      title,
      description: description || null,
      category,
      listId,
    }

    if (dueDateRaw) {
      try {
        createData.dueDate = new Date(dueDateRaw)
      } catch {}
    } else {
      // default dueDate to end of creation day (23:59) to avoid null inputs on frontend
      const now = new Date()
      createData.dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0)
    }

    if (reminderOffset) {
      createData.reminderOffset = reminderOffset
    }

    const task = await prisma.task.create({
      data: createData,
    })

    return NextResponse.json(task, {
      status: 201,
    })
  } catch (error) {
    console.error('Error creating task:', error)

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}