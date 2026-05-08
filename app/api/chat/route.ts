import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const { system, messages, context, lang } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: 'Missing GEMINI_API_KEY' }, { status: 500 });

    const langInstruction = lang === 'he'
      ? '\n\nReply in Hebrew (עברית). Keep replies concise.'
      : '\n\nReply in English. Keep replies concise.';
    const sys = (context ? `${system}\n\nUser context:\n${JSON.stringify(context)}` : system) + langInstruction;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    });

    if (!r.ok || !r.body) {
      const errBody = await r.text();
      return NextResponse.json({ error: errBody.slice(0, 200) }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = r.body!.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const parts = buf.split('\n\n');
            buf = parts.pop() || '';
            for (const part of parts) {
              const line = part.split('\n').find(l => l.startsWith('data: '));
              if (!line) continue;
              const json = line.slice(6).trim();
              if (!json || json === '[DONE]') continue;
              try {
                const obj = JSON.parse(json);
                const text = obj?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
                if (text) controller.enqueue(new TextEncoder().encode(text));
              } catch {}
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 });
  }
}
