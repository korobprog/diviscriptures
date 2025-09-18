import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации для ИИ настроек
const AiSettingsSchema = z.object({
  openaiApiKey: z.string().min(1, 'API key is required'),
  selectedModel: z.string().optional(),
  provider: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем, что пользователь - супер-админ
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      );
    }

    // Парсим и валидируем тело запроса
    const body = await request.json();
    const validatedData = AiSettingsSchema.parse(body);

    const { openaiApiKey, selectedModel, provider } = validatedData;

    // Определяем тип ключа
    const isHuggingFace = openaiApiKey.startsWith('hf_');
    const isOpenAI = openaiApiKey.startsWith('sk-');
    
    // Определяем провайдера, если не указан
    const finalProvider = provider || (isHuggingFace ? 'huggingface' : isOpenAI ? 'openai' : 'unknown');

    // Сохраняем в базу данных
    const existingSettings = await (prisma as any).AiSettings.findFirst({
      where: { isActive: true }
    });

    if (existingSettings) {
      // Обновляем существующие настройки
      await (prisma as any).AiSettings.update({
        where: { id: existingSettings.id },
        data: {
          openaiApiKey: isOpenAI ? openaiApiKey : null,
          huggingFaceApiKey: isHuggingFace ? openaiApiKey : null,
          selectedModel: selectedModel || null,
          provider: finalProvider,
          updatedAt: new Date(),
        }
      });
    } else {
      // Создаем новые настройки
      await (prisma as any).AiSettings.create({
        data: {
          openaiApiKey: isOpenAI ? openaiApiKey : null,
          huggingFaceApiKey: isHuggingFace ? openaiApiKey : null,
          selectedModel: selectedModel || null,
          provider: finalProvider,
          isActive: true,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'AI settings saved successfully',
      configured: true,
      keyType: isHuggingFace ? 'Hugging Face' : isOpenAI ? 'OpenAI' : 'Unknown',
    });

  } catch (error) {
    console.error('Error saving AI settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения текущих настроек ИИ
export async function GET() {
  try {
    // Проверяем аутентификацию
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем, что пользователь - супер-админ
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      );
    }

    // Получаем настройки из базы данных
    const settings = await (prisma as any).AiSettings.findFirst({
      where: { isActive: true }
    });

    const isConfigured = !!(settings?.openaiApiKey || settings?.huggingFaceApiKey);
    const keyType = settings?.huggingFaceApiKey ? 'Hugging Face' : 
                   settings?.openaiApiKey ? 'OpenAI' : 'None';

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      hasApiKey: isConfigured,
      keyType: keyType,
      selectedModel: settings?.selectedModel || null,
      provider: settings?.provider || null,
      // Не возвращаем сам ключ по соображениям безопасности
    });

  } catch (error) {
    console.error('Error getting AI settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
