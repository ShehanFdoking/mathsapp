"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function LessonChat({ lessonId }: { lessonId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const question = input;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, question }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } else {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    }
  }

  return (
    <div className="card flex flex-col h-96">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm">Ask anything about this lesson — e.g. "Can you explain step 2 again?"</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-brand-600 text-white ml-auto" : "bg-gray-100 text-gray-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="text-gray-400 text-sm">Thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} className="btn-primary px-4" disabled={loading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
