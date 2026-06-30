import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taskTitle, type, message, scheduledFor } = body;

    // Create email notification record
    const notification = await prisma.emailNotification.create({
      data: {
        userId,
        title: taskTitle,
        type,
        message,
        scheduledFor: new Date(scheduledFor),
      },
    });

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send email immediately or schedule it
    const emailContent = getEmailTemplate(type, taskTitle, message, user.username);

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Mark as sent
    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: { sentAt: new Date() },
    });

    return NextResponse.json(
      { message: 'Email sent successfully', notificationId: notification.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}

function getEmailTemplate(type: string, taskTitle: string, message: string, username?: string | null) {
  const commonStyles = `
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  const baseTemplate = `
    <div style="${commonStyles}">
      <h2>Hello${username ? ` ${username}` : ''}!</h2>
      <p>${message}</p>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        This is an automated notification from AI Reminder.
      </p>
    </div>
  `;

  if (type === 'deadline_reminder') {
    return {
      subject: `Task Deadline: ${taskTitle}`,
      html: baseTemplate.replace(
        '<h2>',
        `<h2 style="color: #e74c3c;">⏰ `
      ),
    };
  } else if (type === 'pre_deadline') {
    return {
      subject: `Reminder: ${taskTitle} Due Soon`,
      html: baseTemplate.replace(
        '<h2>',
        `<h2 style="color: #f39c12;">⏱️ `
      ),
    };
  } else if (type === 'task_completed') {
    return {
      subject: `Great Job! ${taskTitle} Completed`,
      html: baseTemplate.replace(
        '<h2>',
        `<h2 style="color: #27ae60;">✅ `
      ),
    };
  }

  return {
    subject: 'AI Reminder Notification',
    html: baseTemplate,
  };
}
