// Локализация для интерфейса генератора стихов

export const LANGUAGE_NAMES = {
  ru: 'Русский',
  en: 'English', 
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch'
} as const;

export const VERSE_TITLES = {
  ru: (chapter: number, verse: number, bookName: string) => `Стих ${chapter}.${verse} из ${bookName}`,
  en: (chapter: number, verse: number, bookName: string) => `Verse ${chapter}.${verse} from ${bookName}`,
  hi: (chapter: number, verse: number, bookName: string) => `${bookName} का श्लोक ${chapter}.${verse}`,
  es: (chapter: number, verse: number, bookName: string) => `Verso ${chapter}.${verse} de ${bookName}`,
  fr: (chapter: number, verse: number, bookName: string) => `Verset ${chapter}.${verse} de ${bookName}`,
  de: (chapter: number, verse: number, bookName: string) => `Vers ${chapter}.${verse} aus ${bookName}`
} as const;

export const SECTION_LABELS = {
  ru: {
    sanskrit: 'Санскрит:',
    transliteration: 'Транслитерация:',
    translation: 'Перевод:',
    commentary: 'Комментарий Шрилы Прабхупады:',
    source: 'Источник:'
  },
  en: {
    sanskrit: 'Sanskrit:',
    transliteration: 'Transliteration:',
    translation: 'Translation:',
    commentary: 'Commentary by Śrīla Prabhupāda:',
    source: 'Source:'
  },
  hi: {
    sanskrit: 'संस्कृत:',
    transliteration: 'लिप्यंतरण:',
    translation: 'अनुवाद:',
    commentary: 'श्रीला प्रभुपाद की टिप्पणी:',
    source: 'स्रोत:'
  },
  es: {
    sanskrit: 'Sánscrito:',
    transliteration: 'Transliteración:',
    translation: 'Traducción:',
    commentary: 'Comentario de Śrīla Prabhupāda:',
    source: 'Fuente:'
  },
  fr: {
    sanskrit: 'Sanskrit:',
    transliteration: 'Transliteration:',
    translation: 'Traduction:',
    commentary: 'Commentaire de Śrīla Prabhupāda:',
    source: 'Source:'
  },
  de: {
    sanskrit: 'Sanskrit:',
    transliteration: 'Transliteration:',
    translation: 'Übersetzung:',
    commentary: 'Kommentar von Śrīla Prabhupāda:',
    source: 'Quelle:'
  }
} as const;

export const BOOK_NAMES = {
  ru: {
    'Бхагавад-гита': 'Бхагавад-гита',
    'Шримад-Бхагаватам': 'Шримад-Бхагаватам',
    'Чайтанья-Чаритамрита': 'Чайтанья-Чаритамрита'
  },
  en: {
    'Бхагавад-гита': 'Bhagavad-gītā',
    'Шримад-Бхагаватам': 'Śrīmad-Bhāgavatam',
    'Чайтанья-Чаритамрита': 'Caitanya-caritāmṛta'
  },
  hi: {
    'Бхагавад-гита': 'भगवद्गीता',
    'Шримад-Бхагаватам': 'श्रीमद्भागवतम्',
    'Чайтанья-Чаритамрита': 'चैतन्यचरितामृत'
  },
  es: {
    'Бхагавад-гита': 'Bhagavad-gītā',
    'Шримад-Бхагаватам': 'Śrīmad-Bhāgavatam',
    'Чайтанья-Чаритамрита': 'Caitanya-caritāmṛta'
  },
  fr: {
    'Бхагавад-гита': 'Bhagavad-gītā',
    'Шримад-Бхагаватам': 'Śrīmad-Bhāgavatam',
    'Чайтанья-Чаритамрита': 'Caitanya-caritāmṛta'
  },
  de: {
    'Бхагавад-гита': 'Bhagavad-gītā',
    'Шримад-Бхагаватам': 'Śrīmad-Bhāgavatam',
    'Чайтанья-Чаритамрита': 'Caitanya-caritāmṛta'
  }
} as const;

export type LanguageCode = keyof typeof LANGUAGE_NAMES;

export function getVerseTitle(language: LanguageCode, chapter: number, verse: number, bookName: string): string {
  const bookNameLocalized = BOOK_NAMES[language]?.[bookName as keyof typeof BOOK_NAMES[LanguageCode]] || bookName;
  const titleFunction = VERSE_TITLES[language];
  
  if (typeof titleFunction === 'function') {
    return titleFunction(chapter, verse, bookNameLocalized);
  }
  
  // Fallback to Russian if language is not supported
  const fallbackFunction = VERSE_TITLES['ru'];
  if (typeof fallbackFunction === 'function') {
    return fallbackFunction(chapter, verse, bookNameLocalized);
  }
  
  // Ultimate fallback
  return `Стих ${chapter}.${verse} из ${bookNameLocalized}`;
}

export function getSectionLabel(language: LanguageCode, section: keyof typeof SECTION_LABELS[LanguageCode]): string {
  return SECTION_LABELS[language]?.[section] || section;
}
