import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];

export async function POST(req: Request) {
  try {
    const { system, messages, context, lang } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const langInstruction = lang === 'he'
      ? '\n\nReply in Hebrew (עברית). Be concise.'
      : '\n\nReply in English. Be concise.';
    const sys = (context ? `${system}\n\nContext:\n${JSON.stringify(context)}` : system) + langInstruction;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let lastErr = 'no model responded';
    for (const model of MODELS) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(25000)
        });
        const data = await r.json();
        if (r.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') {
          lastErr = data?.error?.message || 'quota exceeded';
          continue;
        }
        if (!r.ok) {
          lastErr = data?.error?.message || `HTTP ${r.status}`;
          continue;
        }
        const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
        if (reply) return NextResponse.json({ reply, model });
      } catch (e: any) {
        lastErr = e?.message || 'fetch failed';
      }
    }
    return NextResponse.json({ reply: '', error: lastErr }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ reply: '', error: e?.message || 'unknown' }, { status: 500 });
  }
}
