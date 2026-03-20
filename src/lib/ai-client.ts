import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type AIModel = 'gpt-5.4' | 'claude-sonnet-4-6' | 'claude-opus-4-6';

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  model: AIModel
): Promise<string> {
  if (model.startsWith('claude')) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
    return block.text;
  }

  if (model.startsWith('gpt')) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model,
      instructions: systemPrompt,
      input: userMessage,
      text: { format: { type: 'json_object' } },
    });

    const text = response.output_text;
    if (!text) throw new Error('Empty response from OpenAI');
    return text;
  }

  throw new Error(`Unsupported model: ${model}`);
}
