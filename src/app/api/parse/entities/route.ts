import { NextRequest, NextResponse } from 'next/server';
import { buildEntityPrompt } from '@/prompts/parse-entities';
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

    const entities = unwrapArray(parsed).map((e: unknown, i: number) => {
      const obj = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
      return {
        id: obj.id ?? `entity-${i}`,
        name: obj.name ?? '',
        type: obj.type ?? 'c_corp',
        jurisdiction: obj.jurisdiction ?? '',
        roles: Array.isArray(obj.roles) ? obj.roles : [],
        ...obj,
      };
    });
    return NextResponse.json(entities);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Entity parsing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
