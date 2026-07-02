import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/prisma'

function createFallbackList(name: string, userId: string) {
  const now = new Date().toISOString()

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    userId,
    createdAt: now,
    updatedAt: now,
    isOwner: true,
    isCollaborator: false,
  }
}

function getUserIdFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-key'
    const decoded = jwt.verify(
      token,
      secret
    ) as {
      userId: string
      email: string
    }

    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json([], { status: 200 })
    }

    const lists = await prisma.list.findMany({
      where: {
        OR: [
          { userId },
          {
            listPermissions: {
              some: {
                friendId: userId,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        listPermissions: {
          select: { friendId: true },
        },
      },
    })

    // Annotate lists so frontend can show "Shared" labels and know ownership
    const annotated = lists.map((l) => ({
      id: l.id,
      name: l.name,
      userId: l.userId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      isOwner: l.userId === userId,
      isCollaborator: (l.listPermissions || []).some((p) => p.friendId === userId),
    }))

    return NextResponse.json(annotated)
  } catch (error) {
    console.error(error)

    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdFromRequest(req)

    const body = await req.json()

    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const fallbackUserId = userId || 'local-user';

    if (!process.env.DATABASE_URL || !userId) {
      return NextResponse.json(createFallbackList(name, fallbackUserId), {
        status: 201,
      })
    }

    try {
      const list = await prisma.list.create({
        data: {
          name,
          userId,
        },
      })

      return NextResponse.json(list, {
        status: 201,
      })
    } catch (error) {
      console.error(error)

      return NextResponse.json(createFallbackList(name, userId), {
        status: 201,
      })
    }
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    )
  }
}