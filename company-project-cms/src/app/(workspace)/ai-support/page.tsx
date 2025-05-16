"use client";

import React, { useRef, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { useChat } from "@ai-sdk/react";
import useAuthStore from "@/store/store";
import Image from "next/image";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, error, reload } =
    useChat({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopy = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => toast.success("Message copied to clipboard"))
      .catch(() => toast.error("Failed to copy message"));
  };

  return (
    <div className="min-h-screen  dark:text-gray-200 flex items-center justify-center p-4">
      <div className="w-full rounded-lg shadow-md px-8 flex flex-col h-[85vh]">
        <div className="p-4 flex bg-slate-800 dark:bg-slate-800 text-gray-200 dark:text-gray-300 justify-between items-center rounded-t-lg">
          <h1 className="text-xl font-bold">TaskForce AI Support</h1>
          {error && (
            <div className="flex items-center">
              <p className="text-sm mr-2 text-red-200">An error occurred.</p>
              <Button
                onClick={() => reload()}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-800 dark:text-gray-100 py-10">
              Start a conversation with AI Assistant!
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`mb-4 flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <Image
                      src="/asset/ai-bot.webp" // Replace with actual path
                      alt="AI Bot"
                      width={32}
                      height={32}
                      className="rounded-full mr-2 w-12 h-12"
                    />
                  )}
                  <div
                    className={`relative p-3 rounded-lg max-w-[80%] break-words ${
                      isUser
                        ? "bg-blue-100 dark:bg-teal-900  text-blue-900 dark:text-gray-200"
                        : "bg-gray-200 text-gray-800 dark:bg-teal-950 dark:text-gray-200"
                    }`}
                  >
                    <Markdown
                      components={{
                        code(props) {
                          const { children, className, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter language={match[1]} style={dark}>
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code {...rest} className={className}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {m.content}
                    </Markdown>
                    {!isUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(m.content)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isUser && (
                    <Image
                      src={user?.avatar || "/asset/avatar-pic.png"} // Replace with actual path or fallback
                      alt="User"
                      width={32}
                      height={32}
                      className="rounded-full ml-2 w-12"
                    />
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t rounded-2xl flex items-center relative dark:bg-stone-900"
        >
          <textarea
            rows={2}
            value={input}
            onChange={handleInputChange}
            disabled={!!error}
            className="w-full p-2 pr-10 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            placeholder="Ask me anything..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            className="absolute right-6 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-600 bg-transparent hover:bg-transparent"
            disabled={!!error}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
