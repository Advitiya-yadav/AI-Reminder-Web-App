export async function syncLocalTasksWithServer(token?: string) {
  if (!token) return { synced: 0 };
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('tasks:'));
    let synced = 0;
    for (const key of keys) {
      const listId = key.split(':')[1];
      if (!listId) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let localTasks = [];
      try { localTasks = JSON.parse(raw); } catch { continue; }

      // fetch server tasks for this list to avoid duplicates
      const res = await fetch(`/api/lists/${listId}?type=personal`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) continue;
      const serverTasks = await res.json().catch(() => []);
      const titleSet = new Set((serverTasks || []).map((t: any) => String(t.title || '').toLowerCase().trim()));

      for (const t of localTasks) {
        const title = String(t.title || '').trim();
        if (!title) continue;
        if (titleSet.has(title.toLowerCase())) continue;

        const form = new FormData();
        form.append('title', title);
        form.append('contextId', String(listId));
        form.append('contextType', 'personal');
        if (t.category) form.append('category', t.category);

        try {
          const post = await fetch('/api/tasks', { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } });
          if (post.ok) {
            synced += 1;
          }
        } catch (err) {
          // ignore individual failures
        }
      }

      // refresh cached tasks from server after sync
      try {
        const fresh = await fetch(`/api/lists/${listId}?type=personal`, { headers: { Authorization: `Bearer ${token}` } });
        if (fresh.ok) {
          const d = await fresh.json();
          localStorage.setItem(key, JSON.stringify(d));
        }
      } catch {}
    }

    return { synced };
  } catch (error) {
    return { synced: 0 };
  }
}
