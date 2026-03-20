import { NextRequest, NextResponse } from 'next/server';
import { buildConsiderationPrompt } from '@/prompts/parse-consideration';
import { callLLM, AIModel } from '@/lib/ai-client';

function unwrapArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const values = Object.values(parsed as Record<string, unknown>);
    const arr = values.find(v => Array.isArray(v));
    if (arr) return arr as unknown[];
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const { rawText, entities, relationships, structure, model = 'gpt-5.4' } = await req.json();
    if (!rawText || !entities || !relationships || !structure) {
      return NextResponse.json({ error: 'rawText, entities, relationships, and structure are required' }, { status: 400 });
    }

    const prompt = buildConsiderationPrompt(rawText, entities, relationships, structure);
    const text = await callLLM(prompt.system, prompt.user, model as AIModel);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json(unwrapArray(parsed));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Consideration parsing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
