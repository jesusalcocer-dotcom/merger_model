import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildEntityPrompt } from '@/prompts/parse-entities';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json();
    if (!rawText) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const prompt = buildEntityPrompt(rawText);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Try to parse JSON, handling possible markdown wrapping
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try stripping markdown code fences
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
