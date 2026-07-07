import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, password, phone, username } = body

    if (!email || !password || !phone) {
      return NextResponse.json(
        { error: 'Email, password and phone are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const trimmedName = typeof username === 'string' ? username.trim() : ''
    const displayName = trimmedName || email.split('@')[0]

    const user = await prisma.user.create({
      data: {
        email,
        username: displayName,
        phoneNumber: phone,
        passwordHash: hashedPassword,
      },
    })

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

    return NextResponse.json(
      {
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username || displayName,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}