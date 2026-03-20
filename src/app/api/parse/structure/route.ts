import { NextRequest, NextResponse } from 'next/server';
import { buildStructurePrompt } from '@/prompts/parse-structure';
import { callLLM, AIModel } from '@/lib/ai-client';

export async function POST(req: NextRequest) {
  try {
    const { rawText, entities, relationships, model = 'gpt-5.4' } = await req.json();
    if (!rawText || !entities || !relationships) {
      return NextResponse.json({ error: 'rawText, entities, and relationships are required' }, { status: 400 });
    }

    const prompt = buildStructurePrompt(rawText, entities, relationships);
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
    console.error('Structure parsing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
