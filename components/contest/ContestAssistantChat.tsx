"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatContext = {
  rules: string[];
  problem_titles: string[];
  faqs: string[];
};

type LocalMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ContestAssistantChat({ context }: { context: ChatContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");

  const { completion, complete, isLoading, setCompletion } = useCompletion({
    api: "/api/ai/chat",
    streamProtocol: "text",
  });

  const onSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || isLoading) {
      return;
    }

    const nextHistory = [...messages, { role: "user" as const, content: question }];
    setMessages(nextHistory);
    setInput("");
    setCompletion("");

    const answer = await complete(question, {
      body: {
        prompt: question,
        history: nextHistory,
        context,
      },
    });

    if (answer) {
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
      setCompletion("");
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,360px)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <h3 className="text-sm font-semibold">Contest Assistant</h3>
            <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="h-80 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && !completion ? (
              <p className="text-muted-foreground">Ask about rules, scoring, and participation details.</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-lg bg-accent/20 p-2"
                      : "mr-8 rounded-lg bg-background p-2"
                  }
                >
                  {message.content}
                </div>
              ))
            )}
            {completion ? <div className="mr-8 rounded-lg bg-background p-2">{completion}</div> : null}
          </div>
          <form onSubmit={onSend} className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              aria-label="Contest assistant message"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <Button
        type="button"
        className="fixed bottom-4 right-4 z-40 rounded-full px-4"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="mr-2 size-4" />
        Assistant
      </Button>
    </>
  );
}
