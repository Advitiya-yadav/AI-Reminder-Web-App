'use client';
import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, Send } from 'lucide-react';

type AiMenuProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeListId: string | number;
  activeListName: string;
};

const AiMenu: React.FC<AiMenuProps> = ({ isOpen, setIsOpen, activeListId, activeListName }) => {
  const [report, setReport] = useState<{ summary: string; report: string; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timeframe: 'daily' }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
      setError('Unable to generate an AI report right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`fixed top-0 right-0 h-full w-88 max-w-[92vw] bg-[#FDF6EC] border-l border-[#F2D9B3] flex flex-col justify-between p-5 shadow-2xl transition-transform duration-300 ease-in-out z-50 ${
      isOpen ? 'translate-x-0 animate-slide-in-right' : 'translate-x-full'
    }`}>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-semibold text-[#8A4B12]">
            <Sparkles size={18} className="text-[#F28C38]" />
            <span>AI Insights</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 text-gray-500 transition hover:bg-[#FFF3E6] hover:text-[#8A4B12]">
            <X size={18} />
          </button>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#F2D9B3] bg-white px-4 py-2.5 text-sm font-medium text-[#8A4B12] shadow-sm transition hover:bg-[#FFF3E6] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating...' : 'Generate Report'}
        </button>

        <div className="mb-4 flex min-h-48 flex-1 flex-col justify-start rounded-2xl border border-[#F2D9B3] bg-white p-4 text-left shadow-sm">
          <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C47A2C]">
            
          </span>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : report ? (
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="mb-1 font-semibold text-[#8A4B12]">Overview</p>
                <p>{report.summary}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold text-[#8A4B12]">Insights</p>
                <p className="whitespace-pre-wrap">{report.report}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold text-[#8A4B12]">Recommendations</p>
                <ul className="list-disc space-y-1 pl-5">
                  {report.recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="px-4 text-center text-sm text-gray-500">
              Generate an AI-powered report for {activeListName || 'your selected list'}.
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-xl border border-[#F2D9B3] bg-white p-2.5 shadow-sm">
        <input type="text" placeholder={`Ask about ${activeListName}...`} className="w-full bg-transparent pl-2 text-sm focus:outline-none placeholder-gray-400 text-gray-700" />
        <button className="rounded-lg bg-[#F28C38] p-2 text-white transition-all shadow-sm hover:bg-[#e07b27]">
          <Send size={14} />
        </button>
      </div>
    </aside>
  );
};

export default AiMenu;