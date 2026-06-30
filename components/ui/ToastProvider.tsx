'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type Toast = {
  id: string;
  title?: string;
  description?: string;
  type?: 'info' | 'success' | 'error';
};

type ToastContextValue = {
  push: (t: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (t: Omit<Toast, 'id'>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const toast: Toast = { id, ...t };
    setToasts((s) => [toast, ...s]);
    // auto-remove
    setTimeout(() => setToasts((s) => s.filter(x => x.id !== id)), 4500);
    return id;
  };

  const remove = (id: string) => setToasts((s) => s.filter(x => x.id !== id));

  const value = useMemo(() => ({ push, remove }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col-reverse gap-3 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`w-96 max-w-full rounded-lg px-4 py-3 shadow-lg border ${t.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' : t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-gray-100 text-gray-900'}`}>
            {t.title && <div className="font-semibold text-sm mb-0.5">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
