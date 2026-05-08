import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MODEL = 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const { system, messages, context, lang } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const langInstruction = lang === 'he'
      ? '\n\nReply in Hebrew (עברית). Be concise — max 5 short bullets or 3 short sentences.'
      : '\n\nReply in English. Be concise — max 5 short bullets or 3 short sentences.';
    const sys = (context ? `${system}\n\nContext:\n${JSON.stringify(context)}` : system) + langInstruction;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }),
      signal: AbortSignal.timeout(25000)
    });

    const data = await r.json();
    if (!r.ok) return NextResponse.json({ reply: '', error: data?.error?.message || 'API error' }, { status: 500 });

    const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: '', error: e?.message || 'unknown' }, { status: 500 });
  }
}
