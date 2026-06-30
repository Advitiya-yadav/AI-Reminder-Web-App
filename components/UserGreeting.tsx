'use client';

import { useEffect, useState } from 'react';
import { getGreeting } from '@/lib/localization';
import { Globe } from 'lucide-react';

interface UserGreetingProps {
  userId: string;
  token: string;
}

export default function UserGreeting({ userId, token }: UserGreetingProps) {
  const [username, setUsername] = useState('User');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username || 'User');
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
        <div className="text-5xl opacity-50">📋</div>
      </div>
    </div>
  );
}
