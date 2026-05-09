import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FAST_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];
const SEARCH_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'];

export async function POST(req: Request) {
  try {
    const { system, messages, context, lang, useSearch } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: '', error: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const langInstruction = lang === 'he'
      ? '\n\nReply in Hebrew (עברית). Concise, no preamble.'
      : '\n\nReply in English. Concise, no preamble.';
    const sys = (context ? `${system}\n\nContext:\n${JSON.stringify(context)}` : system) + langInstruction;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const baseBody: any = {
      systemInstruction: { parts: [{ text: sys }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: useSearch ? 1200 : 500,
        thinkingConfig: { thinkingBudget: 0 }
      }
    };
    if (useSearch) baseBody.tools = [{ google_search: {} }];

    const models = useSearch ? SEARCH_MODELS : FAST_MODELS;
    let lastErr = 'no model responded';

    for (const model of models) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseBody),
          signal: AbortSignal.timeout(useSearch ? 50000 : 20000)
        });
        const data = await r.json();
        if (r.status === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') {
          lastErr = data?.error?.message || 'quota';
          continue;
        }
        if (!r.ok) {
          lastErr = data?.error?.message || `HTTP ${r.status}`;
          continue;
        }
        const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
        const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = chunks.map((c: any) => c.web ? { uri: c.web.uri, title: c.web.title } : null).filter(Boolean).slice(0, 8);
        if (reply) return NextResponse.json({ reply, model, sources });
      } catch (e: any) {
        lastErr = e?.message || 'fetch failed';
      }
    }
    return NextResponse.json({ reply: '', error: lastErr }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ reply: '', error: e?.message || 'unknown' }, { status: 500 });
  }
}
