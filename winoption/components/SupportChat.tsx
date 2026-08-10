"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I am WinOption AI Support. How can I help you today?",
    },
  ]);

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) {
      return;
    }

    setMessage("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: text,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Support request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.reply ||
            "I could not generate a response. Please try again.",
        },
      ]);
    } catch (error) {
      console.error("Support chat error:", error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Support is temporarily unavailable. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[9999] w-[calc(100vw-32px)] max-w-[390px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between bg-green-600 px-4 py-4">
            <div>
              <h3 className="text-base font-bold text-white">
                WinOption AI Support
              </h3>

              <p className="text-xs text-green-100">
                AI support assistant
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1 text-2xl leading-none text-white hover:bg-green-700"
            >
              ×
            </button>
          </div>

          <div className="h-[360px] space-y-3 overflow-y-auto p-4">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`flex ${
                  item.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    item.role === "user"
                      ? "bg-green-600 text-white"
                      : "bg-slate-800 text-gray-200"
                  }`}
                >
                  {item.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-gray-300">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 bg-slate-900 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask AI Support..."
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-green-500"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-5 right-4 z-[9999] rounded-full bg-green-600 px-5 py-4 font-bold text-white shadow-2xl hover:bg-green-700"
      >
        {open ? "Close" : "AI Support"}
      </button>
    </>
  );
}
