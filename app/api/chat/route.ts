export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const FAST_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];
const SEARCH_MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash'];

export async function POST(req: Request) {
  const { system, messages, context, lang, useSearch } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('⚠️ Missing GEMINI_API_KEY', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

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
      maxOutputTokens: useSearch ? 1200 : 600,
      thinkingConfig: { thinkingBudget: 0 }
    }
  };
  if (useSearch) baseBody.tools = [{ google_search: {} }];

  const models = useSearch ? SEARCH_MODELS : FAST_MODELS;
  const enc = new TextEncoder();

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    let lastErr = 'no model responded';
    let success = false;
    for (const model of models) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baseBody)
        });

        if (!r.ok || !r.body) {
          let msg = `HTTP ${r.status}`;
          try { const j = await r.json(); msg = j?.error?.message || msg; if (j?.error?.status === 'RESOURCE_EXHAUSTED') msg = 'quota'; } catch {}
          lastErr = msg;
          continue;
        }

        success = true;
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let sources: any[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split('\n\n');
          buf = events.pop() || '';
          for (const ev of events) {
            const dataLine = ev.split('\n').find(l => l.startsWith('data: '));
            if (!dataLine) continue;
            const json = dataLine.slice(6).trim();
            if (!json || json === '[DONE]') continue;
            try {
              const obj = JSON.parse(json);
              const parts = obj?.candidates?.[0]?.content?.parts || [];
              for (const p of parts) {
                if (typeof p.text === 'string' && p.text.length) {
                  await writer.write(enc.encode(p.text));
                }
              }
              const chunks = obj?.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (Array.isArray(chunks)) sources = chunks;
            } catch {}
          }
        }

        if (sources.length) {
          const formatted = sources.map((c: any) => c.web ? { uri: c.web.uri, title: c.web.title } : null).filter(Boolean).slice(0, 8);
          if (formatted.length) await writer.write(enc.encode(`\n\n__SOURCES__${JSON.stringify(formatted)}`));
        }
        break;
      } catch (e: any) {
        lastErr = e?.message || 'fetch failed';
      }
    }
    if (!success) await writer.write(enc.encode(`⚠️ ${lastErr}`));
    await writer.close();
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no'
    }
  });
}
