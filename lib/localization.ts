export const greetings = {
  en: 'Hello',
  es: 'Hola',
  fr: 'Bonjour',
  de: 'Guten Tag',
  zh: '你好',
  hi: 'नमस्ते',
  ja: 'こんにちは',
  pt: 'Olá',
  ko: '안녕하세요',
  ar: 'مرحبا',
};

export const language_names = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  hi: 'हिंदी',
  ja: '日本語',
  pt: 'Português',
  ko: '한국어',
  ar: 'العربية',
};

export type LanguageCode = keyof typeof greetings;

export function getGreeting(language: string | null | undefined): string {
  const lang = (language?.toLowerCase() || 'en') as LanguageCode;
  return greetings[lang] || greetings.en;
}

export function getLanguageName(language: string | null | undefined): string {
  const lang = (language?.toLowerCase() || 'en') as LanguageCode;
  return language_names[lang] || language_names.en;
}

export const supportedLanguages = Object.entries(language_names).map(([code, name]) => ({
  code: code as LanguageCode,
  name,
}));
