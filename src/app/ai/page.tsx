"use client";

import { useEffect, useRef, useState } from "react";
import { ChatBubble, TypingBubble } from "@/components/ai/ChatBubble";
import { Card } from "@/components/ui/Card";
import { mockAdvisorRespond, type AIChatMessage } from "@/lib/engine/aiAdvisor";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

const SUGGESTED_PROMPTS = [
  "How long until I'm debt-free?",
  "What if I paid $50 extra a month?",
  "What happens if I miss a payment?",
  "Should I switch to avalanche?",
];

export default function AIPage() {
  const { state, isLoaded, addChatMessage } = useAppState();
  const { snapshot } = useFinancials();
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.chatMessages, isThinking]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    const userMessage: AIChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed, date: new Date() };
    addChatMessage(userMessage);
    setDraft("");
    setIsThinking(true);
    const history = [...state.chatMessages, userMessage];
    const responseText = await mockAdvisorRespond(trimmed, snapshot, history);
    // A brief pause reads as thoughtful rather than an obviously-instant lookup.
    await new Promise((resolve) => setTimeout(resolve, 350));
    addChatMessage({ id: crypto.randomUUID(), role: "advisor", text: responseText, date: new Date() });
    setIsThinking(false);
  }

  if (!isLoaded) return null;

  if (!state.hasCompletedOnboarding) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ask Zero</h1>
        <Card className="mt-5 py-8 text-center text-sm text-muted-foreground">
          Finish setting up your profile on the Home tab first.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-4.75rem)] w-full max-w-md flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="mb-3 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ask Zero</h1>
        <p className="mt-1 text-sm text-muted-foreground">Talk through a decision before you make it.</p>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-3">
        {state.chatMessages.length === 0 && (
          <div className="flex flex-col gap-3">
            <Card className="text-sm text-muted-foreground">
              Ask me anything about your debts — a hypothetical extra payment, what a late payment would cost, or how
              snowball compares to avalanche for your numbers.
            </Card>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary-soft"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.chatMessages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isThinking && <TypingBubble />}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mb-[max(0.75rem,env(safe-area-inset-bottom))] flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface p-1.5 pl-4"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about a decision…"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isThinking}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
