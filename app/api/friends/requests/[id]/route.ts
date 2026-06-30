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

// Accept friend request
export async function POST(
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
    const { action } = body; // "accept" or "reject"

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    if (friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Update request status
      await prisma.friendRequest.update({
        where: { id },
        data: { status: 'accepted' },
      });

      // Create friendship
      await prisma.friendship.create({
        data: {
          user1Id: friendRequest.requesterId,
          user2Id: friendRequest.receiverId,
        },
      });

      return NextResponse.json({ message: 'Friend request accepted' });
    } else if (action === 'reject') {
      await prisma.friendRequest.update({
        where: { id },
        data: { status: 'rejected' },
      });

      return NextResponse.json({ message: 'Friend request rejected' });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error handling friend request:', error);
    return NextResponse.json(
      { error: 'Failed to handle friend request' },
      { status: 500 }
    );
  }
}
