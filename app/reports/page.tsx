'use client';

import { DailyReportCard, WeeklyReportCard, MonthlyReportCard } from '@/components/reports/ReportCards';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">AI-Powered Reports</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-gray-600">
            Get AI-generated insights about your productivity across different timeframes. Our AI analyzes your task completion patterns, productivity trends, and generates personalized recommendations to help you stay organized and productive.
          </p>
        </div>

        <DailyReportCard />
        <WeeklyReportCard />
        <MonthlyReportCard />
      </div>
    </div>
  );
}
