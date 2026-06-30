export const TASK_CATEGORY_OPTIONS = [
  'productivity',
  'work',
  'social',
  'health',
  'personal',
  'study',
  'errands',
  'creative',
] as const;

export type TaskCategory = (typeof TASK_CATEGORY_OPTIONS)[number];

const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  productivity: ['focus', 'plan', 'goal', 'routine', 'priority', 'project', 'deep work', 'study'],
  work: ['meeting', 'client', 'email', 'report', 'office', 'deadline', 'presentation', 'work'],
  social: ['call', 'message', 'chat', 'friend', 'family', 'hangout', 'social', 'visit'],
  health: ['gym', 'walk', 'meditation', 'sleep', 'drink', 'meal', 'workout', 'health'],
  personal: ['home', 'organize', 'clean', 'shopping', 'chores', 'personal'],
  study: ['learn', 'read', 'course', 'practice', 'exam', 'study', 'revision'],
  errands: ['buy', 'pickup', 'drop', 'errand', 'appointment', 'bank', 'post'],
  creative: ['design', 'write', 'idea', 'brainstorm', 'create', 'creative'],
};

export function normalizeTaskCategory(value?: string | null): TaskCategory {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if ((TASK_CATEGORY_OPTIONS as readonly string[]).includes(normalized)) {
      return normalized as TaskCategory;
    }
  }

  return 'productivity';
}

export function inferTaskCategory(title: string, description?: string | null): TaskCategory {
  const haystack = `${title} ${description || ''}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TaskCategory, string[]][]) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return 'productivity';
}
