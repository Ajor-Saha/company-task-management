"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip } from "lucide-react";
import useAuthStore from "@/store/store";
import { Axios } from "@/config/axios";
import { env } from "@/config/env";
import axios from "axios";
import Image from "next/image";

interface Sender {
  userId: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  projectId: string;
  createdAt: string;        // ISO
  sender: Sender;
}

interface ChatWidgetProps {
  projectId: string;
}

const DEFAULT_AVATAR = "/asset/avatar-pic.png";

const ChatWidget: React.FC<ChatWidgetProps> = ({ projectId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { user } = useAuthStore();
  const didConnect = useRef(false);

    const fetchHistory = useCallback(async () => {
    try {
      const resp = await Axios.get(
        `${env.BACKEND_BASE_URL}/api/message/get-project-message/${projectId}`
      );
      if (resp.data.success) {
        setMessages(resp.data.data);
      } else {
        console.error("Chat history error:", resp.data.message);
      }
    } catch (err) {
      console.error("Fetch history failed:", err);
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data);
      }
    }
  }, [projectId]);

  // ─── 1) Create socket when isOpen becomes true ─────────────────────────────
  useEffect(() => {
    if (isOpen && !socket) {
      fetchHistory();

      const s = io("http://localhost:8000", {
        path: "/socket.io",
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      s.on("connect", () => {
        console.log("Socket connected:", s.id);
        setSocket(s);
      });
      s.on("connect_error", (e) => console.error("Socket error:", e.message));
    }
  }, [isOpen, socket, fetchHistory]);

  // ─── 2) Clean up socket when isOpen becomes false ────────────────────────────
  useEffect(() => {
    // When the widget is closed, tear down the socket
    if (!isOpen && socket) {
      console.log("🔴 Tearing down socket:", socket.id);
      socket.disconnect();
      setSocket(null);
      didConnect.current = false; // reset for next open
    }
  }, [isOpen, socket]);

  // ─── 3) Join room & subscribe to incoming messages ──────────────────────────
  useEffect(() => {
    if (
      socket &&
      socket.connected &&            // only once fully connected
      projectId &&
      user?.userId &&
      !didConnect.current            // only the first time
    ) {
      didConnect.current = true;
      console.log("📥 Emitting joinProject for:", projectId);
      socket.emit("joinProject", projectId);
      

      socket.on("newMessage", (msg: Message) => {
        console.log("📩 Received newMessage:", msg);
        if (msg.projectId === projectId) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      socket.on("messageError", (err) => {
        console.error("⚠️ messageError:", err.message);
      });

      // No cleanup here: we only subscribe once per open.
    }
  }, [socket, projectId, user?.userId]);

  // ─── 4) Handle sending ─────────────────────────────────────────────────────
  const handleSend = () => {
    if (!socket || !socket.connected) {
      console.warn("🚫 Cannot send: socket not connected");
      return;
    }
    if (!input.trim() || !user?.userId) return;

    console.log("📤 Emitting sendMessage:", input);
    socket.emit("sendMessage", {
      projectId,
      content: input.trim(),
      senderId: user.userId,
      avatar: user.avatar || DEFAULT_AVATAR,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    setInput("");
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
        <div className="flex flex-col w-[90vw] max-w-lg h-[80vh] bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              Project Chat
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((m) => {
              const isMe = m.sender.userId === user?.userId;
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2 ${
                    isMe ? "justify-end" : ""
                  }`}
                >
                  {/* avatar */}
                  {!isMe && (
                    <div className="relative group">
                      <Image
                        src={m.sender.avatar || DEFAULT_AVATAR}
                        alt={m.sender.firstName}
                        className="w-8 h-8 rounded-full object-cover"
                        height={80}
                        width={80}
                      />
                      <div className="absolute bottom-0 left-0 transform translate-y-full scale-0 group-hover:scale-100 transition-transform bg-gray-700 text-white text-xs px-2 py-1 rounded">
                        {m.sender.firstName}
                      </div>
                    </div>
                  )}

                  {/* bubble */}
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg break-words mb-4 ${
                      isMe
                        ? "bg-gray-200 dark:bg-gray-700 self-end rounded-br-none"
                        : "bg-gray-100 dark:bg-gray-800 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* my avatar */}
                  {isMe && (
                    <Image
                      src={user.avatar || DEFAULT_AVATAR}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full object-cover"
                      title={user.firstName}
                      width={80}
                      height={80}
                    />
                  )}
                </div>
              );
            })}
          </ScrollArea>

          {/* Input */}
          <div className="px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 resize-none bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg px-3 py-2 outline-none text-gray-800 dark:text-gray-100"
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                }
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
