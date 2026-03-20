import { NextRequest, NextResponse } from 'next/server';
import { buildEntityPrompt } from '@/prompts/parse-entities';
import { callLLM, AIModel } from '@/lib/ai-client';

export async function POST(req: NextRequest) {
  try {
    const { rawText, model = 'gpt-5.4' } = await req.json();
    if (!rawText) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const prompt = buildEntityPrompt(rawText);
    const text = await callLLM(prompt.system, prompt.user, model as AIModel);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Entity parsing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
