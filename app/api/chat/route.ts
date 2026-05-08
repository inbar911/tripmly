import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { system, messages, context } = await req.json();

    const sys = context ? `${system}\n\nUser context:\n${JSON.stringify(context, null, 2)}` : system;

    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: sys,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content }))
    });

    const reply = resp.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n');

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: '', error: e?.message || 'unknown' }, { status: 500 });
  }
}
