import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildStructurePrompt } from '@/prompts/parse-structure';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { rawText, entities, relationships } = await req.json();
    if (!rawText || !entities || !relationships) {
      return NextResponse.json({ error: 'rawText, entities, and relationships are required' }, { status: 400 });
    }

    const prompt = buildStructurePrompt(rawText, entities, relationships);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

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
