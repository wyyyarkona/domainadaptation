"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TypingBubble from "./TypingBubble";
import ProgressBar from "./ProgressBar";
import ResultCard from "./ResultCard";

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
  const [showResult, setShowResult] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userMsgCount = messages.filter((m) => m.role === "user").length;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Auto-focus input after assistant replies
  useEffect(() => {
    if (!loading && started && !showResult) {
      inputRef.current?.focus();
    }
  }, [loading, started, showResult]);

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
      setMessages([
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
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
      // Smooth transition delay
      setTimeout(() => setShowResult(true), 1200);
    } catch {
      // silently fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetAll = () => {
    setMessages([]);
    setResult(null);
    setStarted(false);
    setShowResult(false);
  };

  // ──── Landing screen ────
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl">💬</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent mb-3">
            MBTI Chat
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Discover your personality type through a natural conversation.
            Just chat with me and I&apos;ll figure out your MBTI!
          </p>
          <button
            onClick={startChat}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-3.5 rounded-full text-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.97]"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  // ──── Result screen ────
  if (showResult && result) {
    return <ResultCard result={result} onRetry={resetAll} />;
  }

  // ──── Chat screen ────
  const isComplete = result !== null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-800">
                MBTI Assessment
              </h1>
              <p className="text-xs text-gray-400">
                {isComplete ? "Analysis complete!" : loading ? "Typing..." : "Online"}
              </p>
            </div>
          </div>
          <ProgressBar current={userMsgCount} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const displayText = msg.content.replace("[ASSESSMENT_COMPLETE]", "").trim();

            return (
              <div
                key={i}
                className={`flex items-end gap-2 animate-message-in ${
                  isUser ? "justify-end" : "justify-start"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Avatar — assistant only */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-br-md shadow-md shadow-indigo-200/50"
                      : "bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm"
                  }`}
                >
                  {displayText}
                </div>

                {/* Avatar — user only */}
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-white font-bold">U</span>
                  </div>
                )}
              </div>
            );
          })}

          {loading && <TypingBubble />}

          {/* Assessment complete transition */}
          {isComplete && !showResult && (
            <div className="flex justify-center py-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing your personality...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className={`bg-white/80 backdrop-blur-md border-t border-gray-200/60 px-4 py-3 transition-opacity duration-500 ${isComplete ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors placeholder:text-gray-400"
            disabled={loading || isComplete}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || isComplete}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
