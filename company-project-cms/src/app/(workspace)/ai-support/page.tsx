"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, SendHorizontal, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import Markdown from "react-markdown"
import { useChat } from "@ai-sdk/react"
import useAuthStore from "@/store/store"
import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, error, reload, setMessages } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const [isBackNavigation, setIsBackNavigation] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Add a ref to track if we've added a history entry
  const historyAddedRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (messages.length > 0) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [messages])

  // Add history entry when component mounts or messages change from empty to non-empty
  useEffect(() => {
    if (messages.length > 0 && !historyAddedRef.current) {
      // Add a history entry to enable back button detection
      window.history.pushState({ chatPage: true }, "", window.location.href)
      historyAddedRef.current = true
      console.log("Added history entry for chat page")
    } else if (messages.length === 0) {
      historyAddedRef.current = false
    }
  }, [messages])

  useEffect(() => {
    const handleNavigation = () => {
      if (messages.length > 0) {
        setLeaveDialogOpen(true)
        return false
      }
      return true
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      const href = link?.getAttribute("href")
      if (link && href && !href.startsWith("#")) {
        if (!handleNavigation()) {
          e.preventDefault()
          setPendingPath(href)
        }
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [messages])

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (messages.length > 0) {
        // Don't push state back immediately - just show dialog
        setLeaveDialogOpen(true)
        setPendingPath("__BROWSER_NAVIGATION__")
        setIsBackNavigation(true)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [messages])

  const saveConversation = async () => {
    try {
      const conversationData = {
        id: `chat-${Date.now()}`,
        messages,
        timestamp: new Date().toISOString(),
        userId: user?.userId || "anonymous",
      }

      const savedConversations = JSON.parse(localStorage.getItem("savedConversations") || "[]")
      savedConversations.push(conversationData)
      localStorage.setItem("savedConversations", JSON.stringify(savedConversations))

      toast.success("Conversation saved")
      return true
    } catch (error) {
      console.error("Error saving conversation:", error)
      toast.error("Failed to save conversation")
      return false
    }
  }

  const handleSaveAndLeave = async () => {
    await saveConversation()
    setLeaveDialogOpen(false)

    if (pendingPath === "__BROWSER_NAVIGATION__") {
      setIsBackNavigation(false)
      setMessages([])
      // Use a timeout to ensure state is cleared before navigation
      setTimeout(() => {
        window.history.back()
      }, 0)
    } else if (pendingPath) {
      router.push(pendingPath)
      setMessages([])
    }

    setPendingPath(null)
  }

  const handleDontSaveAndLeave = () => {
    setLeaveDialogOpen(false)

    if (pendingPath === "__BROWSER_NAVIGATION__") {
      setIsBackNavigation(false)
      setMessages([])
      // Use a timeout to ensure state is cleared before navigation
      setTimeout(() => {
        window.history.back()
      }, 0)
    } else if (pendingPath) {
      router.push(pendingPath)
      setMessages([])
    }

    setPendingPath(null)
  }

  const cancelLeave = () => {
    if (pendingPath === "__BROWSER_NAVIGATION__") {
      // User wants to stay - push the current state back to prevent navigation
      window.history.pushState(null, "", window.location.href)
      setIsBackNavigation(false)
    }
    setLeaveDialogOpen(false)
    setPendingPath(null)
  }

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast.success("Copied to clipboard")
        setCopiedMessageId(messageId)
        setTimeout(() => setCopiedMessageId(null), 2000)
      })
      .catch(() => toast.error("Failed to copy"))
  }

  const handleDelete = (messageId: string) => {
    const updated = messages.filter((m) => m.id !== messageId)
    setMessages(updated)
    toast.success("Message deleted")
  }

  const handleDirectClear = () => {
    if (messages.length > 0) {
      setMessages([])
      toast.success("Chat cleared")
    } else {
      toast.info("No conversation to clear")
    }
  }

  return (
    <>
      <div className="min-h-screen dark:text-gray-200 flex items-center justify-center p-4">
        <div className="w-full rounded-lg shadow-md px-8 flex flex-col h-[85vh]">
          {/* Header */}
          <div className="p-4 flex bg-slate-800 text-gray-200 justify-between items-center rounded-t-lg">
            <h1 className="text-xl font-bold">TaskForce AI Support</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDirectClear}
                variant="outline"
                size="sm"
                className="text-gray-200 border-gray-600 "
              >
                Clear Chat
              </Button>
              {error && (
                <div className="flex items-center">
                  <p className="text-sm mr-2 text-red-200">An error occurred.</p>
                  <Button onClick={() => reload()} className="bg-red-500 text-white hover:bg-red-600">
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-800 dark:text-gray-100 py-10">
                Start a conversation with AI Assistant!
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user"
                const isCopied = copiedMessageId === m.id

                return (
                  <div key={m.id} className="mb-6">
                    <div className={`mb-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <Image
                          src="/asset/ai-bot.webp"
                          alt="AI Bot"
                          width={32}
                          height={32}
                          className="rounded-full mr-2 w-12 h-12"
                        />
                      )}
                      <div
                        className={`p-3 rounded-lg max-w-[80%] break-words ${
                          isUser
                            ? "bg-blue-100 dark:bg-teal-900 text-blue-900 dark:text-gray-200"
                            : "bg-gray-200 text-gray-800 dark:bg-teal-950 dark:text-gray-200"
                        }`}
                      >
                        <Markdown
                          components={{
                            code({ children, className }) {
                              const match = /language-(\w+)/.exec(className || "")
                              return match ? (
                                <SyntaxHighlighter language={match[1]} style={dark}>
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className}>{children}</code>
                              )
                            },
                          }}
                        >
                          {m.content}
                        </Markdown>
                      </div>
                      {isUser && (
                        <Image
                          src={user?.avatar || "/asset/avatar-pic.png"}
                          alt="User"
                          width={32}
                          height={32}
                          className="rounded-full ml-2 w-12 h-12"
                        />
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex gap-2 text-sm ${isUser ? "justify-end pr-14" : "justify-start pl-14"}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(m.content, m.id)}
                        className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(m.id)}
                        className="h-8 px-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
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
                  e.preventDefault()
                  handleSubmit(e)
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

      {/* Leave Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelLeave()
          else setLeaveDialogOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Support Chat?</DialogTitle>
            <DialogDescription className="text-black dark:text-gray-300">Do you want to save your conversation before leaving?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={cancelLeave}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleDontSaveAndLeave}>
              Don't Save
            </Button>
            <Button onClick={handleSaveAndLeave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
