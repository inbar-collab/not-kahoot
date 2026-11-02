"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, ClientApiError } from "@/lib/api";
import type { Strings } from "@/lib/strings";
import type { AiContext, AiMessage, AiQuiz } from "@/lib/types";
import { Button } from "../ui/Button";

/**
 * Chat with the AI quiz builder. It asks a few questions, then proposes up
 * to 30 questions; the host unticks what they don't want and uses the rest.
 */
export function AiBuilder({
  s,
  context,
  actionLabel,
  onUse,
}: {
  s: Strings;
  /** Present when adding questions to an existing quiz. */
  context?: AiContext;
  actionLabel: (n: number) => string;
  onUse: (quiz: AiQuiz, picked: AiQuiz["questions"]) => Promise<void>;
}) {
  const greeting = context ? s.aiGreetingExisting(context.starName) : s.aiGreeting;
  const [messages, setMessages] = useState<AiMessage[]>([{ role: "assistant", text: greeting }]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<AiQuiz | null>(null);
  const [off, setOff] = useState<Set<number>>(new Set());
  const [using, setUsing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, quiz]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    // The opening greeting is ours, not the model's; the conversation sent starts with the user.
    const next: AiMessage[] = [...messages, { role: "user", text: t }];
    setMessages(next);
    setDraft("");
    setThinking(true);
    setError(null);
    try {
      // Keep the last turns, starting with a user message.
      const convo = next.slice(1).slice(-22);
      if (convo[0]?.role === "assistant") convo.shift();
      const res = await api.post<{ reply: string; quiz: AiQuiz | null }>("/api/ai/chat", { messages: convo, context });
      setMessages((m) => [...m, { role: "assistant", text: res.reply || "🙂" }]);
      if (res.quiz) {
        setQuiz(res.quiz);
        setOff(new Set());
      }
    } catch (e) {
      const c = e instanceof ClientApiError ? e.code : "network";
      const detail = e instanceof ClientApiError && e.detail ? ` (${e.detail})` : "";
      setError((c === "network" ? s.networkError : s.errors[c]) + detail);
      setMessages(next.slice(0, -1));
      setDraft(t);
    }
    setThinking(false);
  }

  const picked = quiz ? quiz.questions.filter((_, i) => !off.has(i)) : [];
  const userTurns = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex max-h-[55dvh] min-h-[260px] flex-col gap-3 overflow-y-auto rounded-3xl border border-ink-700 bg-ink-900 p-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-lg leading-snug ${
                m.role === "user" ? "self-end bg-gold text-ink-950" : "self-start bg-ink-800 text-cream"
              }`}
            >
              {m.role === "assistant" && <span className="me-1" aria-hidden>🤖</span>}
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div className="flex items-center gap-2 self-start rounded-3xl bg-ink-800 px-4 py-3 text-mute" aria-live="polite">
            <span aria-hidden>🤖</span>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-gold"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              />
            ))}
            <span className="sr-only">{s.aiThinking}</span>
          </div>
        )}

        {quiz && !thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 rounded-3xl border border-gold/40 bg-gold/5 p-3">
            <p className="font-bold text-gold-soft">{s.aiReady(quiz.questions.length)}</p>
            {quiz.practice && (
              <div className="rounded-2xl bg-ink-850 p-3">
                <p className="text-sm font-bold text-gold">{s.qPractice}</p>
                <p className="font-bold">{quiz.practice.text}</p>
                <p className="text-sm text-mute">{quiz.practice.options.join(" · ")}</p>
              </div>
            )}
            <ol className="flex flex-col gap-2">
              {quiz.questions.map((q, i) => (
                <li key={i}>
                  <label className={`flex cursor-pointer gap-3 rounded-2xl p-3 ${off.has(i) ? "bg-ink-900 opacity-50" : "bg-ink-850"}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]"
                      checked={!off.has(i)}
                      onChange={() =>
                        setOff((cur) => {
                          const n = new Set(cur);
                          if (n.has(i)) n.delete(i);
                          else n.add(i);
                          return n;
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block font-bold leading-snug">
                        {i + 1}. {q.text}
                      </span>
                      <span className="block text-sm text-mute">{q.options.join(" · ")}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ol>
            <Button
              size="lg"
              busy={using}
              disabled={picked.length === 0}
              onClick={async () => {
                setUsing(true);
                await onUse(quiz, picked).catch(() => {});
                setUsing(false);
              }}
            >
              {actionLabel(picked.length)}
            </Button>
            <p className="text-center text-sm text-mute">{s.aiTweak}</p>
          </motion.div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-ink-800 p-3 text-lg">
          ⚠️ {error}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <textarea
          value={draft}
          rows={1}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          placeholder={s.aiPlaceholder}
          aria-label={s.aiPlaceholder}
          className="min-h-[56px] flex-1 resize-none rounded-2xl border-2 border-ink-600 bg-ink-850 px-4 py-3 text-lg text-cream placeholder:text-ink-500 focus:border-gold focus:outline-none"
        />
        <Button type="submit" size="md" disabled={!draft.trim() || thinking}>
          {s.aiSend}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!quiz ? (
          <Button variant="secondary" size="md" disabled={thinking} onClick={() => void send(s.aiGoAheadText)}>
            {s.aiGoAhead}
          </Button>
        ) : (
          <span />
        )}
        {userTurns > 0 && (
          <Button
            variant="quiet"
            onClick={() => {
              setMessages([{ role: "assistant", text: greeting }]);
              setQuiz(null);
              setError(null);
            }}
          >
            {s.aiStartOver}
          </Button>
        )}
      </div>
      <p className="text-sm text-mute">🔒 {s.aiPrivacy}</p>
    </div>
  );
}
