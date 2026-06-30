'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, X, Check, Minus } from 'lucide-react';

interface Friend {
  id: string;
  email: string;
  username?: string;
}

interface FriendRequest {
  id: string;
  requestee: {
    id: string;
    email: string;
    username?: string;
  };
}

interface FriendsPageProps {
  compact?: boolean;
}

export default function FriendsPage({ compact = false }: FriendsPageProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchFriendsAndRequests();
  }, []);

  async function fetchFriendsAndRequests() {
    try {
      const res = await fetch('/api/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFriends(await res.json());
      }

      const reqRes = await fetch('/api/friends/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reqRes.ok) {
        setRequests(await reqRes.json());
      }
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientEmail: email }),
      });

      if (res.ok) {
        setSuccess('Friend request sent!');
        setEmail('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send request');
      }
    } catch (err) {
      setError('Error sending request');
      console.error(err);
    }
  }

  async function handleRequest(requestId: string, action: 'accept' | 'reject') {
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setSuccess(`Request ${action}ed!`);
        setRequests(requests.filter((r) => r.id !== requestId));
        if (action === 'accept') {
          fetchFriendsAndRequests();
        }
      }
    } catch (err) {
      setError('Error handling request');
      console.error(err);
    }
  }

  if (loading) return <div className="p-6 text-center text-sm text-gray-500">Loading your friends...</div>;

  return (
    <div className={compact ? 'space-y-4' : 'mx-auto max-w-4xl p-6'}>
      {!compact && (
        <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold text-[#8A4B12]">
          <Users className="h-8 w-8 text-[#F28C38]" />
          Friends
        </h1>
      )}

      <div className="rounded-2xl border border-[#F2D9B3] bg-white/80 p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#8A4B12]">
          <UserPlus className="h-5 w-5 text-[#F28C38]" />
          Add Friend
        </h2>
        <form onSubmit={handleSendRequest} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            placeholder="Friend's email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-xl border border-[#F2D9B3] bg-[#FFF8F0] px-4 py-2.5 text-sm text-gray-700 outline-none ring-0 placeholder:text-gray-400"
            required
          />
          <button
            type="submit"
            className="rounded-xl bg-[#F28C38] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e07b27]"
          >
            Send Request
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-emerald-600">{success}</p>}
      </div>

      {requests.length > 0 && (
        <div className="rounded-2xl border border-[#F2D9B3] bg-white/80 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#8A4B12]">Pending Requests</h2>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="animate-bounce-in flex flex-col gap-3 rounded-xl border border-[#F2D9B3] bg-[#FFF8F0] p-3 sm:flex-row sm:items-center sm:justify-between" style={{ willChange: 'transform, opacity' }}>
                <div>
                  <p className="font-medium text-gray-800">{req.requestee.username || req.requestee.email}</p>
                  <p className="text-sm text-gray-600">{req.requestee.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRequest(req.id, 'accept')} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white transform-gpu hover:scale-105 transition-transform" aria-label="Accept request">
                    <Check size={18} />
                  </button>
                  <button onClick={() => handleRequest(req.id, 'reject')} className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white transform-gpu hover:scale-105 transition-transform" aria-label="Reject request">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#F2D9B3] bg-white/80 p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#8A4B12]">Your Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-600">No friends yet. Send a friend request to get started.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {friends.map((friend) => (
              <div key={friend.id} className="rounded-xl border border-[#F2D9B3] bg-[#FFF8F0] p-4 transition hover:shadow-sm">
                <p className="font-semibold text-gray-800">{friend.username || friend.email}</p>
                <p className="text-sm text-gray-600">{friend.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
