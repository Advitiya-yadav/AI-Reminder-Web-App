 'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Calendar, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';

interface ReportData {
  summary: string;
  report: string;
  recommendations: string[];
}

export function DailyReportCard() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const toast = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeframe: 'daily',
          date: selectedDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        toast.push({ title: 'Report failed', description: 'Failed to generate report', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.push({ title: 'Report failed', description: 'Error generating report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Daily Report</h2>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={generateReport}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <p className="text-blue-800">{report.summary}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-green-900">Insights</h3>
            </div>
            <p className="text-green-800 whitespace-pre-wrap">{report.report}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Recommendations</h3>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {report.recommendations?.map((rec, index) => (
                <li key={index} className="text-purple-800">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function WeeklyReportCard() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeframe: 'weekly',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        toast.push({ title: 'Report failed', description: 'Failed to generate report', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.push({ title: 'Report failed', description: 'Error generating report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold">Weekly Report</h2>
        </div>
      </div>

      <button
        onClick={generateReport}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 mb-6"
      >
        <RefreshCw className="w-4 h-4" />
        {loading ? 'Generating...' : 'Generate Weekly Report'}
      </button>

      {report && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <p className="text-blue-800">{report.summary}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-green-900">Insights</h3>
            </div>
            <p className="text-green-800 whitespace-pre-wrap">{report.report}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Recommendations</h3>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {report.recommendations?.map((rec, index) => (
                <li key={index} className="text-purple-800">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthlyReportCard() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeframe: 'monthly',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        toast.push({ title: 'Report failed', description: 'Failed to generate report', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.push({ title: 'Report failed', description: 'Error generating report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Monthly Report</h2>
        </div>
      </div>

      <button
        onClick={generateReport}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 mb-6"
      >
        <RefreshCw className="w-4 h-4" />
        {loading ? 'Generating...' : 'Generate Monthly Report'}
      </button>

      {report && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <p className="text-blue-800">{report.summary}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-green-900">Insights</h3>
            </div>
            <p className="text-green-800 whitespace-pre-wrap">{report.report}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Recommendations</h3>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {report.recommendations?.map((rec, index) => (
                <li key={index} className="text-purple-800">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
