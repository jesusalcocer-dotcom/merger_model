import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildRelationshipPrompt } from '@/prompts/parse-relationships';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { rawText, entities } = await req.json();
    if (!rawText || !entities) {
      return NextResponse.json({ error: 'rawText and entities are required' }, { status: 400 });
    }

    const prompt = buildRelationshipPrompt(rawText, entities);

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
    console.error('Relationship parsing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
