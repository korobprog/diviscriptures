import OpenAI from 'openai';

// Типы для священных текстов
export interface SacredText {
  id: string;
  title: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  commentary?: string;
  source: string;
  cached: boolean;
  language: string;
  bookName: string;
}

// Доступные модели по провайдерам
export const AI_MODELS = {
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Быстрая и экономичная модель', free: false },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Быстрая модель для простых задач', free: false },
  ],
  huggingface: [
    { id: 'distilgpt2', name: 'DistilGPT-2', description: 'Легкая модель для текстовой генерации', free: true },
    { id: 'gpt2', name: 'GPT-2', description: 'Классическая модель генерации текста', free: true },
    { id: 'microsoft/DialoGPT-small', name: 'DialoGPT Small', description: 'Компактная модель для диалогов', free: true },
    { id: 'microsoft/DialoGPT-medium', name: 'DialoGPT Medium', description: 'Модель для диалогов', free: true },
    { id: 'facebook/opt-1.3b', name: 'OPT-1.3B', description: 'Open Pre-trained Transformer', free: true },
    { id: 'EleutherAI/pythia-1.4b-deduped', name: 'Pythia-1.4B', description: 'Модель для исследований', free: true },
    { id: 'google/vaultgemma-1b', name: 'VaultGemma-1B', description: 'Эффективная модель от Google', free: true },
  ]
} as const;

export interface VerseRequest {
  text: string; // например, "Бхагавад-гита", "Шримад-Бхагаватам"
  chapter: number;
  verse: number;
  language?: string; // 'ru', 'en', 'hi', 'es', 'fr', 'de'
}

// Инициализация AI клиентов
let openai: OpenAI | null = null;
let huggingFaceApiKey: string | null = null;

export function initializeOpenAI(apiKey: string) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  openai = new OpenAI({
    apiKey: apiKey,
  });
  
  return openai;
}

export function initializeHuggingFace(apiKey: string) {
  if (!apiKey) {
    throw new Error('Hugging Face API key is required');
  }
  
  huggingFaceApiKey = apiKey;
  return apiKey;
}

export function getOpenAIClient(): OpenAI {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
  }
  return openai;
}

export function getHuggingFaceApiKey(): string {
  if (!huggingFaceApiKey) {
    throw new Error('Hugging Face API key not initialized.');
  }
  return huggingFaceApiKey;
}

// Функция для работы с Hugging Face API
async function callHuggingFaceAPI(prompt: string, apiKey: string, modelId: string = 'distilgpt2'): Promise<string> {
  // Используем выбранную модель для текстовой генерации
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_length: 100,
        temperature: 0.7,
        do_sample: true,
        return_full_text: false,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hugging Face API error:', response.status, errorText);
    
    // Если модель не готова, попробуем другую
    if (response.status === 503) {
      console.log('Model is loading, trying alternative approach...');
      return `Тестовый ответ от Hugging Face API для промпта: "${prompt.substring(0, 50)}..."`;
    }
    
    throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Hugging Face API response:', data);
  
  if (Array.isArray(data) && data.length > 0) {
    return data[0].generated_text || data[0].text || 'Ответ от Hugging Face API';
  }
  
  return data.generated_text || data.text || 'Ответ от Hugging Face API';
}

// Промпты для разных священных текстов
const SACRED_TEXT_PROMPTS = {
  'Бхагавад-гита': {
    system: `Ты - эксперт по священным текстам вайшнавской традиции. Твоя задача - предоставить точный стих из Бхагавад-гиты с санскритом, транслитерацией, переводом и кратким комментарием.

Формат ответа должен быть в JSON:
{
  "sanskrit": "оригинальный текст на санскрите",
  "transliteration": "транслитерация латиницей",
  "translation": "перевод на указанный язык",
  "commentary": "краткий духовный комментарий (2-3 предложения)"
}

Важно: используй только аутентичные тексты из Бхагавад-гиты. Если стих не существует, верни ошибку.`,
    
    user: (chapter: number, verse: number, language: string) => 
      `Предоставь стих ${chapter}.${verse} из Бхагавад-гиты на языке ${language}.`
  },
  
  'Шримад-Бхагаватам': {
    system: `Ты - эксперт по священным текстам вайшнавской традиции. Твоя задача - предоставить точный стих из Шримад-Бхагаватам с санскритом, транслитерацией, переводом и кратким комментарием.

Формат ответа должен быть в JSON:
{
  "sanskrit": "оригинальный текст на санскрите",
  "transliteration": "транслитерация латиницей", 
  "translation": "перевод на указанный язык",
  "commentary": "краткий духовный комментарий (2-3 предложения)"
}

Важно: используй только аутентичные тексты из Шримад-Бхагаватам. Если стих не существует, верни ошибку.`,
    
    user: (chapter: number, verse: number, language: string) => 
      `Предоставь стих ${chapter}.${verse} из Шримад-Бхагаватам на языке ${language}.`
  },
  
  'Чайтанья-Чаритамрита': {
    system: `Ты - эксперт по священным текстам вайшнавской традиции. Твоя задача - предоставить точный стих из Чайтанья-Чаритамриты с санскритом, транслитерацией, переводом и кратким комментарием.

Формат ответа должен быть в JSON:
{
  "sanskrit": "оригинальный текст на санскрите",
  "transliteration": "транслитерация латиницей",
  "translation": "перевод на указанный язык", 
  "commentary": "краткий духовный комментарий (2-3 предложения)"
}

Важно: используй только аутентичные тексты из Чайтанья-Чаритамриты. Если стих не существует, верни ошибку.`,
    
    user: (chapter: number, verse: number, language: string) => 
      `Предоставь стих ${chapter}.${verse} из Чайтанья-Чаритамриты на языке ${language}.`
  }
};

// Маппинг языков
const LANGUAGE_MAP = {
  'ru': 'русский',
  'en': 'английский', 
  'hi': 'хинди',
  'es': 'испанский',
  'fr': 'французский',
  'de': 'немецкий'
};

/**
 * Генерирует стих из священного текста
 */
export async function generateVerse(request: VerseRequest, apiKey?: string, modelId?: string): Promise<SacredText> {
  // Определяем тип API ключа
  const isHuggingFace = apiKey?.startsWith('hf_');
  const isOpenAI = apiKey?.startsWith('sk-');
  
  let client: OpenAI | null = null;
  
  if (isHuggingFace && apiKey) {
    // Инициализируем Hugging Face
    initializeHuggingFace(apiKey);
  } else if (isOpenAI && apiKey) {
    // Инициализируем OpenAI с переданным ключом
    client = initializeOpenAI(apiKey);
  } else {
    // Используем клиент по умолчанию
    client = getOpenAIClient();
  }
  
  const textName = request.text;
  const language = LANGUAGE_MAP[request.language as keyof typeof LANGUAGE_MAP] || 'русский';
  
  // Проверяем, есть ли промпт для данного текста
  const prompt = SACRED_TEXT_PROMPTS[textName as keyof typeof SACRED_TEXT_PROMPTS];
  if (!prompt) {
    throw new Error(`Unsupported sacred text: ${textName}`);
  }
  
  try {
    let response: string;
    let source: string;
    
    if (isHuggingFace && apiKey) {
      // Используем Hugging Face API
      const userPrompt = prompt.user(request.chapter, request.verse, language);
      try {
        response = await callHuggingFaceAPI(userPrompt, apiKey, modelId);
        source = `Hugging Face (${modelId || 'distilgpt2'})`;
      } catch (hfError) {
        console.error('Hugging Face API failed, using fallback:', hfError);
        // Fallback для Hugging Face
        response = `Стих ${request.chapter}.${request.verse} из ${textName} (сгенерировано с помощью Hugging Face API). Это тестовый ответ для проверки работы API.`;
        source = 'Hugging Face (Fallback)';
      }
    } else {
      // Используем OpenAI API
      const completion = await client!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: prompt.system
          },
          {
            role: "user", 
            content: prompt.user(request.chapter, request.verse, language)
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      
      response = completion.choices[0]?.message?.content || '';
      source = 'OpenAI GPT-4o-mini';
    }
    
    if (!response) {
      throw new Error(`No response from ${source}`);
    }
    
    // Обрабатываем ответ в зависимости от источника
    let verseData;
    
    if (isHuggingFace) {
      // Для Hugging Face возвращаем простой формат
      verseData = {
        sanskrit: `Стих ${request.chapter}.${request.verse} из ${textName}`,
        transliteration: '',
        translation: response,
        commentary: 'Сгенерировано с помощью Hugging Face API'
      };
    } else {
      // Для OpenAI пытаемся распарсить JSON
      try {
        verseData = JSON.parse(response);
      } catch (parseError) {
        // Если не удалось распарсить JSON, создаем базовую структуру
        verseData = {
          sanskrit: "Стих не найден",
          transliteration: "Verse not found", 
          translation: "Стих не найден в базе данных",
          commentary: "Пожалуйста, проверьте правильность номера главы и стиха."
        };
      }
    }
    
    // Создаем объект SacredText
    const sacredText: SacredText = {
      id: `${textName.toLowerCase().replace(/\s+/g, '-')}-${request.chapter}-${request.verse}`,
      title: textName,
      chapter: request.chapter,
      verse: request.verse,
      sanskrit: verseData.sanskrit || "Стих не найден",
      transliteration: verseData.transliteration || "Verse not found",
      translation: verseData.translation || "Стих не найден в базе данных",
      commentary: verseData.commentary || "Пожалуйста, проверьте правильность номера главы и стиха.",
      source: source,
      cached: false,
      language: request.language || 'ru',
      bookName: textName
    };
    
    return sacredText;
    
  } catch (error) {
    console.error('Error generating verse:', error);
    
    // Возвращаем заглушку в случае ошибки
    return {
      id: `${textName.toLowerCase().replace(/\s+/g, '-')}-${request.chapter}-${request.verse}`,
      title: textName,
      chapter: request.chapter,
      verse: request.verse,
      sanskrit: "Ошибка загрузки",
      transliteration: "Loading error",
      translation: "Произошла ошибка при загрузке стиха. Проверьте подключение к интернету.",
      commentary: "Пожалуйста, попробуйте еще раз или обратитесь к администратору.",
      source: "Error",
      cached: false,
      language: request.language || 'ru',
      bookName: textName
    };
  }
}

/**
 * Получает список доступных священных текстов
 */
export function getAvailableSacredTexts(): string[] {
  return Object.keys(SACRED_TEXT_PROMPTS);
}

/**
 * Проверяет, поддерживается ли священный текст
 */
export function isSacredTextSupported(textName: string): boolean {
  return textName in SACRED_TEXT_PROMPTS;
}

/**
 * Получает информацию о священном тексте
 */
export function getSacredTextInfo(textName: string): { name: string; description: string } | null {
  const info = {
    'Бхагавад-гита': {
      name: 'Бхагавад-гита',
      description: 'Священный текст индуизма, часть Махабхараты, содержащий 700 стихов в 18 главах'
    },
    'Шримад-Бхагаватам': {
      name: 'Шримад-Бхагаватам', 
      description: 'Один из основных пуранических текстов вайшнавизма, содержащий 18,000 стихов в 12 канто'
    },
    'Чайтанья-Чаритамрита': {
      name: 'Чайтанья-Чаритамрита',
      description: 'Биография и учение Шри Чайтаньи Махапрабху, основоположника гаудия-вайшнавизма'
    }
  };
  
  return info[textName as keyof typeof info] || null;
}
