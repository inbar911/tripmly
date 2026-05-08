'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { useI18n } from './I18nProvider';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function ChatBot({
  systemPrompt,
  initialAssistantMessage,
  context
}: {
  systemPrompt: string;
  initialAssistantMessage: string;
  context?: Record<string, any>;
}) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: initialAssistantMessage }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || busy) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const next: ChatMessage[] = [...messages, userMsg, { role: 'assistant', content: '' }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: systemPrompt, messages: [...messages, userMsg], context, lang })
      });
      if (!res.ok || !res.body) {
        setMessages(prev => {
          const c = [...prev];
          c[c.length - 1] = { role: 'assistant', content: t('chat.unknown') };
          return c;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const c = [...prev];
          c[c.length - 1] = { role: 'assistant', content: acc };
          return c;
        });
      }
    } catch {
      setMessages(prev => {
        const c = [...prev];
        c[c.length - 1] = { role: 'assistant', content: t('chat.error') };
        return c;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <span className="font-semibold">{t('chat.title')}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-800'}`}>
              {m.content || (busy && i === messages.length - 1 ? '…' : '')}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-100 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('chat.placeholder')} className="input" disabled={busy} />
        <button className="btn-primary !px-4" disabled={busy || !input.trim()} aria-label="send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
