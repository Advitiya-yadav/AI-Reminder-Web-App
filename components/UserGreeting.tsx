'use client';

import { useEffect, useState } from 'react';
import { getGreeting } from '@/lib/localization';

const normalizeDisplayName = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase();
  if (normalized === 'undefined' || normalized === 'null') return '';
  return trimmed;
};

interface UserGreetingProps {
  userId: string;
  token: string;
}

export default function UserGreeting({ userId, token }: UserGreetingProps) {
  const [username, setUsername] = useState('User');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  // Logo fallback handling: tries common paths you might have added to /public
  const logoCandidates = [
    '/promptly_logo.png',
    '/promptly_logo.svg',
    '/promptly_logo/logo.png',
    '/promptly_logo/logo.svg',
    '/logo.png',
    '/logo.svg',
    '/file.svg',
    '/globe.svg',
  ];
  const [logoSrc, setLogoSrc] = useState(logoCandidates[0]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const fetchedName = normalizeDisplayName(data.username) || normalizeDisplayName(data.email?.split('@')[0]) || 'User';
          setUsername(fetchedName);
          setLanguage(data.language || 'en');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [userId, token]);

  const greeting = getGreeting(language);

  if (loading) return <div className="text-lg font-semibold text-gray-600">Loading...</div>;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{greeting}, {username}! 👋</h1>
          <p className="text-blue-100 mt-2">Welcome back to your task manager</p>
        </div>
        <div className="w-12 h-12">
          <img
            src={logoSrc}
            alt="Promptly logo"
            className="h-12 w-12 object-contain opacity-95"
            onError={(e) => {
              const idx = logoCandidates.indexOf(logoSrc);
              const next = logoCandidates[idx + 1];
              if (next) setLogoSrc(next);
            }}
          />
        </div>
      </div>
    </div>
  );
}
