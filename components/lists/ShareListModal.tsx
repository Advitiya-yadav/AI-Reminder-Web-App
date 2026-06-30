'use client';

import { useState } from 'react';
import { Share2, X } from 'lucide-react';

interface Permission {
  id: string;
  friend: {
    id: string;
    email: string;
    username?: string;
  };
  canAdd: boolean;
  canEdit: boolean;
  canRemove: boolean;
}

interface ShareListModalProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  friends: Array<{ id: string; email: string; username?: string }>;
}

export default function ShareListModal({
  listId,
  isOpen,
  onClose,
  friends,
}: ShareListModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [canRemove, setCanRemove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function fetchPermissions() {
    try {
      const res = await fetch(`/api/lists/${listId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPermissions(await res.json());
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  }

  async function handleShareList(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFriend) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/lists/${listId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          friendId: selectedFriend,
          canAdd,
          canEdit,
          canRemove,
        }),
      });

      if (res.ok) {
        setSelectedFriend('');
        setCanAdd(false);
        setCanEdit(true);
        setCanRemove(false);
        await fetchPermissions();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to share list');
      }
    } catch (err) {
      setError('Error sharing list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemovePermission(permissionId: string, friendId: string) {
    try {
      const res = await fetch(`/api/lists/${listId}/permissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });

      if (res.ok) {
        setPermissions(permissions.filter((p) => p.id !== permissionId));
      }
    } catch (err) {
      console.error('Error removing permission:', err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Share List
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Add Permission Form */}
        <form onSubmit={handleShareList} className="space-y-4 mb-6 pb-6 border-b">
          <div>
            <label className="block text-sm font-medium mb-2">Select Friend</label>
            <select
              value={selectedFriend}
              onChange={(e) => setSelectedFriend(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a friend...</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.username || friend.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={canAdd}
                onChange={(e) => setCanAdd(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Can Add Tasks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Can Edit Tasks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={canRemove}
                onChange={(e) => setCanRemove(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Can Remove Tasks</span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !selectedFriend}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </form>

        {/* Current Permissions */}
        <div>
          <h3 className="font-semibold mb-3">Current Access</h3>
          {permissions.length === 0 ? (
            <p className="text-gray-600 text-sm">Not shared with anyone yet</p>
          ) : (
            <div className="space-y-2">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {perm.friend.username || perm.friend.email}
                    </p>
                    <p className="text-xs text-gray-600">
                      {[perm.canAdd && 'Add', perm.canEdit && 'Edit', perm.canRemove && 'Remove']
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemovePermission(perm.id, perm.friend.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
