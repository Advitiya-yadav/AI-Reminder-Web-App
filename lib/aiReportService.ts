import Groq from 'groq-sdk';
import { prisma } from './prisma';
import {
  calculateDailyAnalytics,
  calculateWeeklyAnalytics,
  calculateMonthlyAnalytics,
} from './analytics';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const REPORT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export interface ReportContent {
  summary: string;
  insights: string;
  recommendations: string[];
}

function parseReportContent(content: string | null | undefined): ReportContent {
  if (!content) {
    return { summary: '', insights: '', recommendations: [] };
  }

  const trimmed = content.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const rawPayload = match ? match[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(rawPayload) as Partial<ReportContent> & { recommendations?: unknown };
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      insights: typeof parsed.insights === 'string' ? parsed.insights : '',
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((item): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return {
      summary: trimmed,
      insights: '',
      recommendations: [],
    };
  }
}

async function generateDailyReport(
  userId: string,
  date: Date,
  analytics: any
): Promise<ReportContent> {
  const prompt = `
You are a productivity assistant. Generate a brief daily report for a user based on the following metrics:

Date: ${date.toLocaleDateString()}
- Tasks Completed: ${analytics.tasksCompleted}
- Tasks Created: ${analytics.tasksCreated}
- Completion Rate: ${analytics.completionRate}%
- Average Task Completion Time: ${analytics.averageCompletionTime} minutes
- Tasks by Category: ${JSON.stringify(analytics.categoryBreakdown)}
- Category Performance: ${JSON.stringify(analytics.categoryPerformance || {})}

Please provide:
1. A short summary (1-2 sentences)
2. Key insights about productivity patterns, including which task categories the user excels at and which need work
3. 2-3 actionable recommendations for tomorrow, including practical tips for the weaker categories

Format your response as JSON with keys: summary, insights, recommendations (array)
`;

  const message = await groq.chat.completions.create({
    model: REPORT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = parseReportContent(message.choices[0].message.content);

  return content;
}

async function generateWeeklyReport(
  userId: string,
  startDate: Date,
  analytics: any
): Promise<ReportContent> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const prompt = `
You are a productivity analyst. Generate a comprehensive weekly report based on the following metrics:

Week: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
- Total Tasks Completed: ${analytics.tasksCompleted}
- Total Tasks Created: ${analytics.tasksCreated}
- Weekly Completion Rate: ${analytics.completionRate}%
- Average Task Completion Time: ${analytics.averageCompletionTime} minutes
- Productivity Level: ${analytics.productivity}
- Top Categories: ${analytics.topCategories.join(', ')}
- Tasks by Category: ${JSON.stringify(analytics.categoryBreakdown)}
- Category Performance: ${JSON.stringify(analytics.categoryPerformance || {})}

Please provide:
1. A summary of the week's productivity (2-3 sentences)
2. Detailed insights about productivity patterns and trends, including categories where the user excels and categories that need attention
3. 3-4 recommendations for improving next week's productivity, with tailored tips for weaker categories

Format your response as JSON with keys: summary, insights, recommendations (array)
`;

  const message = await groq.chat.completions.create({
    model: REPORT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = parseReportContent(message.choices[0].message.content);

  return content;
}

async function generateMonthlyReport(
  userId: string,
  date: Date,
  analytics: any
): Promise<ReportContent> {
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prompt = `
You are a productivity strategist. Generate a detailed monthly report based on the following metrics:

Month: ${monthName}
- Total Tasks Completed: ${analytics.tasksCompleted}
- Total Tasks Created: ${analytics.tasksCreated}
- Monthly Completion Rate: ${analytics.completionRate}%
- Average Task Completion Time: ${analytics.averageCompletionTime} minutes
- Overall Productivity Level: ${analytics.productivity}
- Top Categories: ${analytics.topCategories.join(', ')}
- Tasks by Category: ${JSON.stringify(analytics.categoryBreakdown)}
- Category Performance: ${JSON.stringify(analytics.categoryPerformance || {})}

Please provide:
1. An executive summary of the month (3-4 sentences)
2. Comprehensive insights about productivity patterns, trends, and areas of focus, including strengths and weak categories
3. 4-5 strategic recommendations for improving productivity in the next month, with targeted advice for weaker categories

Format your response as JSON with keys: summary, insights, recommendations (array)
`;

  const message = await groq.chat.completions.create({
    model: REPORT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = parseReportContent(message.choices[0].message.content);

  return content;
}

export async function generateReport(
  userId: string,
  timeframe: 'daily' | 'weekly' | 'monthly',
  date: Date = new Date()
): Promise<{ report: string; summary: string; recommendations: string[] }> {
  try {
    let analytics;
    let reportContent;
    let period: string;

    if (timeframe === 'daily') {
      analytics = await calculateDailyAnalytics(userId, date);
      reportContent = await generateDailyReport(userId, date, analytics);
      period = date.toISOString().split('T')[0];
    } else if (timeframe === 'weekly') {
      analytics = await calculateWeeklyAnalytics(userId, date);
      reportContent = await generateWeeklyReport(userId, date, analytics);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      period = `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
    } else {
      analytics = await calculateMonthlyAnalytics(userId, date);
      reportContent = await generateMonthlyReport(userId, date, analytics);
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      console.warn(`Skipping report persistence for unknown user: ${userId}`);
    } else {
      try {
        await prisma.report.create({
          data: {
            userId,
            timeframe,
            period,
            aiInsights: reportContent.insights,
            summary: reportContent.summary,
            recommendations: reportContent.recommendations || [],
          },
        });
      } catch (dbError) {
        console.error('Failed to persist report:', dbError);
      }
    }

    return {
      report: reportContent.insights,
      summary: reportContent.summary,
      recommendations: reportContent.recommendations || [],
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

export async function getReport(
  userId: string,
  timeframe: 'daily' | 'weekly' | 'monthly',
  date: Date = new Date()
) {
  let period: string;

  if (timeframe === 'daily') {
    period = date.toISOString().split('T')[0];
  } else if (timeframe === 'weekly') {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    period = `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
  } else {
    period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  return prisma.report.findFirst({
    where: {
      userId,
      timeframe,
      period,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
