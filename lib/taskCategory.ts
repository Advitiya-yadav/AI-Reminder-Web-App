import Groq from 'groq-sdk';

export const TASK_CATEGORY_OPTIONS = [
  'productivity',
  'work',
  'study',
  'health',
  'fitness',
  'food',
  'finance',
  'shopping',
  'home',
  'travel',
  'personal',
  'social',
  'medical',
  'meetings',
  'calls',
  'technology',
  'other',
] as const;

export type TaskCategory = (typeof TASK_CATEGORY_OPTIONS)[number];

const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  productivity: ['focus', 'plan', 'goal', 'routine', 'priority', 'project', 'deep work', 'organize', 'task'],
  work: ['report', 'office', 'deadline', 'presentation', 'job', 'manager', 'client', 'email', 'work'],
  study: ['study', 'learn', 'read', 'course', 'practice', 'exam', 'revision', 'homework', 'lecture', 'research'],
  health: ['health', 'doctor', 'appointment', 'medication', 'symptom', 'vitamin', 'sleep', 'wellness'],
  fitness: ['gym', 'workout', 'run', 'walk', 'exercise', 'training', 'fitness', 'yoga', 'swim'],
  food: ['meal', 'lunch', 'dinner', 'breakfast', 'cook', 'recipe', 'food', 'snack', 'coffee'],
  finance: ['bill', 'pay', 'invoice', 'budget', 'bank', 'invest', 'finance', 'expense', 'salary', 'rent'],
  shopping: ['buy', 'shop', 'purchase', 'order', 'store', 'mall', 'shopping', 'grocery', 'checkout'],
  home: ['home', 'clean', 'chores', 'laundry', 'vacuum', 'repair', 'furniture', 'kitchen'],
  travel: ['trip', 'travel', 'flight', 'hotel', 'train', 'airport', 'ticket', 'road trip', 'commute'],
  personal: ['personal', 'errand', 'birthday', 'self-care', 'relax', 'family', 'hobby'],
  social: ['message', 'chat', 'friend', 'hangout', 'social', 'visit', 'party'],
  medical: ['medical', 'clinic', 'prescription', 'medicine', 'treatment', 'checkup'],
  meetings: ['meeting', 'standup', 'sync', 'review', 'interview', 'discussion', 'scrum'],
  calls: ['call', 'phone', 'callback', 'voicemail', 'ring', 'contact'],
  technology: ['tech', 'software', 'code', 'deploy', 'debug', 'computer', 'app', 'website', 'laptop', 'phone'],
  other: [],
};

const CATEGORY_ALIASES: Record<string, TaskCategory> = {
  productivity: 'productivity',
  work: 'work',
  study: 'study',
  health: 'health',
  fitness: 'fitness',
  food: 'food',
  finance: 'finance',
  shopping: 'shopping',
  home: 'home',
  travel: 'travel',
  personal: 'personal',
  social: 'social',
  medical: 'medical',
  meetings: 'meetings',
  calls: 'calls',
  technology: 'technology',
  other: 'other',
  creative: 'productivity',
  errands: 'shopping',
};

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const AI_CATEGORY_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function parseAIClassifiedCategory(rawContent: string | null | undefined): TaskCategory | null {
  if (!rawContent) {
    return null;
  }

  const trimmed = rawContent.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const rawPayload = match ? match[1].trim() : trimmed;

  try {
    const parsed = JSON.parse(rawPayload) as { category?: unknown; label?: unknown; value?: unknown };
    const candidate =
      typeof parsed.category === 'string'
        ? parsed.category
        : typeof parsed.label === 'string'
        ? parsed.label
        : typeof parsed.value === 'string'
        ? parsed.value
        : null;

    if (candidate) {
      return normalizeTaskCategory(candidate);
    }
  } catch {
    // fall through to direct parsing
  }

  return normalizeTaskCategory(trimmed);
}

export function normalizeTaskCategory(value?: string | null): TaskCategory {
  if (typeof value !== 'string') {
    return 'other';
  }

  const normalized = value.trim().toLowerCase();
  if ((TASK_CATEGORY_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as TaskCategory;
  }

  return CATEGORY_ALIASES[normalized] || 'other';
}

export function inferTaskCategory(title: string, description?: string | null): TaskCategory {
  const haystack = `${title} ${description || ''}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TaskCategory, string[]][]) {
    if (category === 'other') {
      continue;
    }

    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

export async function classifyTaskCategory(title: string, description?: string | null): Promise<TaskCategory> {
  const text = [title, description].filter(Boolean).join(' ').trim();

  if (!text || !groqClient) {
    return 'other';
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: AI_CATEGORY_MODEL,
      max_tokens: 64,
      messages: [
        {
          role: 'system',
          content: 'You classify task text into exactly one category. Respond with only one category from the provided list or a JSON object with a category field. No explanation.',
        },
        {
          role: 'user',
          content: `Task title: ${title}\nDescription: ${description || ''}\nAllowed categories: ${TASK_CATEGORY_OPTIONS.join(', ')}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '';
    const parsedCategory = parseAIClassifiedCategory(content);

    if (parsedCategory && parsedCategory !== 'other') {
      return parsedCategory;
    }
  } catch (error) {
    console.warn('Task category classification failed:', error);
  }

  return 'other';
}
