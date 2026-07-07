import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'dev-secret-key',
      {
        expiresIn: '7d',
      }
    )

    const displayName = user.username || user.email.split('@')[0]

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        username: displayName,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          username: displayName,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}