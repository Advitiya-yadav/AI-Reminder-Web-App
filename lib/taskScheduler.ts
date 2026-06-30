import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { ensureDailyTaskReset } from './taskReset';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function startTaskScheduler() {
  console.log('Starting task scheduler...');

  setInterval(async () => {
    try {
      const now = new Date();
      const users = await prisma.user.findMany({ select: { id: true } });

      for (const user of users) {
        await ensureDailyTaskReset(user.id, now);
      }

      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      const upcomingTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: fiveMinutesFromNow,
          },
          completed: false,
        },
        include: {
          list: {
            include: {
              user: true,
            },
          },
        },
      });

      for (const task of upcomingTasks) {
        // Send pre-deadline notification
        const existingNotif = await prisma.emailNotification.findFirst({
          where: {
            userId: task.list.userId,
            taskId: task.id,
            type: 'pre_deadline',
            sentAt: null,
          },
        });

        if (!existingNotif && task.list.user.email) {
          await sendPreDeadlineEmail(task, task.list.user);
        }
      }
    } catch (error) {
      console.error('Error in task scheduler:', error);
    }
  }, 60000); // Check every minute
}

async function sendPreDeadlineEmail(task: any, user: any) {
  try {
    const minutesUntilDue = Math.ceil(
      (task.dueDate.getTime() - new Date().getTime()) / 1000 / 60
    );

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `⏱️ Reminder: ${task.title} due in ${minutesUntilDue} minutes`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #f39c12;">⏱️ Task Reminder</h2>
          <p>Hi ${user.username || 'there'}!</p>
          <p>Your task <strong>"${task.title}"</strong> is due in <strong>${minutesUntilDue} minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">
            Priority: <strong>${task.priority?.toUpperCase() || 'MEDIUM'}</strong>
          </p>
          ${task.description ? `<p>${task.description}</p>` : ''}
          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            This is an automated notification from AI Reminder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Record the notification as sent
    await prisma.emailNotification.create({
      data: {
        userId: user.id,
        title: task.title,
        type: 'pre_deadline',
        message: `Task due in ${minutesUntilDue} minutes`,
        scheduledFor: task.dueDate,
        sentAt: new Date(),
      },
    });

    console.log(`Pre-deadline email sent to ${user.email} for task: ${task.title}`);
  } catch (error) {
    console.error('Error sending pre-deadline email:', error);
  }
}

export async function sendTaskDeadlineEmail(task: any, user: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `🔔 Task Deadline: ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #e74c3c;">🔔 Task Deadline Alert</h2>
          <p>Hi ${user.username || 'there'}!</p>
          <p>Your task <strong>"${task.title}"</strong> is now due!</p>
          <p style="color: #666; font-size: 14px;">
            Priority: <strong>${task.priority?.toUpperCase() || 'MEDIUM'}</strong>
          </p>
          ${task.description ? `<p>${task.description}</p>` : ''}
          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            This is an automated notification from AI Reminder.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await prisma.emailNotification.create({
      data: {
        userId: user.id,
        title: task.title,
        type: 'deadline_reminder',
        message: `Task deadline: ${task.title}`,
        scheduledFor: task.dueDate,
        sentAt: new Date(),
      },
    });

    console.log(`Deadline email sent to ${user.email} for task: ${task.title}`);
  } catch (error) {
    console.error('Error sending deadline email:', error);
  }
}
