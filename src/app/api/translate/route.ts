import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  baseURL: 'https://openrouter.ai/api/v1'
});

export async function POST(request: NextRequest) {
  try {
    const { texts, targetLanguage } = await request.json();

    console.log('🌐 [Translate API] Request received:', {
      textsCount: texts?.length,
      targetLanguage,
      firstText: texts?.[0]?.substring(0, 50)
    });

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      console.error('❌ [Translate API] Invalid texts array');
      return NextResponse.json({ error: 'Invalid texts array' }, { status: 400 });
    }

    const isToEnglish = targetLanguage === 'en';

    console.log('🤖 [Translate API] Calling OpenRouter/Gemini...');
    
    // 번역 요청
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: isToEnglish 
            ? 'You are a professional translator. Translate the following Korean texts to natural English. Maintain the meaning and tone. Return only the translations, one per line, in the same order.'
            : 'You are a professional translator. Translate the following English texts to natural Korean. Maintain the meaning and tone. Return only the translations, one per line, in the same order.'
        },
        {
          role: 'user',
          content: texts.join('\n---\n')
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const translatedText = completion.choices[0]?.message?.content || '';
    const translations = translatedText.split('\n---\n').map(t => t.trim());

    console.log('✅ [Translate API] Translation completed:', {
      translationsCount: translations.length,
      firstTranslation: translations[0]?.substring(0, 50)
    });

    return NextResponse.json({
      success: true,
      translations
    });

  } catch (error) {
    console.error('❌ [Translate API] Error:', error);
    return NextResponse.json({ 
      error: 'Translation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
