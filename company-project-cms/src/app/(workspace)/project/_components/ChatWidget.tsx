"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Paperclip,
  Mic,
  Smile,
  Plus,
  Globe,
  Lightbulb,
  Rocket,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;

    const newMessage: Message = {
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Simulated bot reply (can be replaced with API)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Thanks for your message!" },
      ]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          variant="default"
          className="rounded-full p-3 shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      ) : (
        <div className="w-[650px] h-[500px] bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              Chat Activity
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 space-y-2 overflow-y-auto bg-muted dark:bg-gray-800">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-md max-w-xs text-sm ${
                  msg.sender === "user"
                    ? "bg-gray-600 text-white dark:text-black self-end ml-auto"
                    : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white self-start mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </ScrollArea>

          <div className="p-2 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              {/* File Upload */}
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-gray-500 dark:text-gray-400"
              >
                <Paperclip className="w-5 h-5" />
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log("Selected file:", file.name);
                    }
                  }}
                />
              </label>

              {/* Textarea-like input */}
              <textarea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend())
                }
                placeholder="Type your message..."
                className="w-full mt-[20px] bg-transparent resize-none outline-none text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              {/* Send button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSend}
                className="text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
