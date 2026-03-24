"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MBTIResult {
  type: string;
  description: string;
  dimensions: { label: string; left: string; right: string; score: number }[];
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startChat = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.reply }]);
    } catch {
      setMessages([{ role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      // Check if assessment is complete
      if (data.reply.includes("[ASSESSMENT_COMPLETE]")) {
        await fetchResult(updatedMessages);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const fetchResult = async (msgs: Message[]) => {
    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // silently fail — user can still see chat
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Landing screen
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-indigo-700 mb-4">
            MBTI Chat Assessment
          </h1>
          <p className="text-gray-600 mb-8">
            Discover your personality type through a natural conversation.
            Answer a few questions and get your MBTI result!
          </p>
          <button
            onClick={startChat}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Your MBTI Type
          </h2>
          <div className="text-6xl font-extrabold text-center text-indigo-600 my-4">
            {result.type}
          </div>
          <p className="text-gray-600 text-center mb-6">{result.description}</p>

          <div className="space-y-4">
            {result.dimensions.map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{dim.left}</span>
                  <span>{dim.right}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setMessages([]);
              setResult(null);
              setStarted(false);
            }}
            className="mt-8 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-indigo-700">
          MBTI Chat Assessment
        </h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800 border border-gray-200 shadow-sm"
              }`}
            >
              {msg.content.replace("[ASSESSMENT_COMPLETE]", "").trim()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-400 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm shadow-sm">
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
