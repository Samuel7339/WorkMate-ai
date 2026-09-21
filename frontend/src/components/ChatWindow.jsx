import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  MessageSquare,
  Trash2,
  BookOpen,
  Ticket,
  User,
  Wrench,
  X,
} from "lucide-react";

import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [error, setError] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [threadId, setThreadId] = useState(() => {
    const existingThreadId = localStorage.getItem("workmate_thread_id");

    if (existingThreadId) {
      return existingThreadId;
    }

    const newThreadId = crypto.randomUUID();

    localStorage.setItem("workmate_thread_id", newThreadId);

    return newThreadId;
  });

  async function loadConversations() {
    try {
      const response = await fetch("http://127.0.0.1:8000/conversations");

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();

      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }

  async function loadHistory(selectedThreadId) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/chat-history/${selectedThreadId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load chat history");
      }

      const data = await response.json();

      if (data.length > 0) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);

      setMessages([]);
    }
  }

  useEffect(() => {
    loadHistory(threadId);
    loadConversations();
  }, [threadId]);

  useEffect(() => {
    if (!waitingForApproval) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/approval-status/${threadId}`,
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.status === "approved" || data.status === "rejected") {
          setWaitingForApproval(false);

          if (data.status === "approved") {
            const ticketId = data.result?.ticket?.ticket_id;

            const message = ticketId
              ? `Your request has been approved. IT ticket ${ticketId} has been created.`
              : "Your request has been approved successfully.";

            setMessages((currentMessages) => [
              ...currentMessages,
              {
                role: "assistant",
                content: message,
              },
            ]);
          } else {
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                role: "assistant",
                content: "Your request was rejected. No IT ticket was created.",
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Approval status check failed:", error);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [waitingForApproval, threadId]);

  function handleNewChat() {
    const newThreadId = crypto.randomUUID();

    localStorage.setItem("workmate_thread_id", newThreadId);

    setWaitingForApproval(false);
    setMessages([]);
    setInput("");
    setError("");
    setThreadId(newThreadId);
    setIsMobileSidebarOpen(false);
  }

  async function handleDeleteConversation(selectedThreadId) {
    if (loading) return;

    const confirmed = await new Promise((resolve) => {
      toast("Are you sure you want to delete?", {
        action: {
          label: "Yes",
          onClick: () => resolve(true),
        },
        cancel: {
          label: "No",
          onClick: () => resolve(false),
        },
        onDismiss: () => resolve(false),
        onAutoClose: () => resolve(false),
      });
    });

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/conversations/${selectedThreadId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      const isCurrentConversation = selectedThreadId === threadId;

      if (isCurrentConversation) {
        const newThreadId = crypto.randomUUID();

        localStorage.setItem("workmate_thread_id", newThreadId);

        setThreadId(newThreadId);

        setMessages([]);
        setInput("");
        setWaitingForApproval(false);
      }

      await loadConversations();
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Failed to delete conversation:", error);

      const errorMsg = "Could not delete the conversation. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  function handleConversationClick(selectedThreadId) {
    if (loading) {
      return;
    }

    localStorage.setItem("workmate_thread_id", selectedThreadId);

    setWaitingForApproval(false);
    setInput("");
    setError("");
    setThreadId(selectedThreadId);
    setIsMobileSidebarOpen(false);
  }

  async function handleSend(event, quickMessage = null) {
    if (event) {
      event.preventDefault();
    }

    const userMessage = (quickMessage !== null ? quickMessage : input).trim();

    if (!userMessage || loading) {
      return;
    }

    setError("");

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        let message = "The WorkMate AI server returned an error.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (data.type === "approval_required") {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content:
              "⚠️ Your request requires approval. It has been sent to an authorized reviewer.",
          },
        ]);

        setWaitingForApproval(true);
      } else {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content:
              data.answer ||
              "I received your request but could not generate a response.",
            sources: data.sources || [],
          },
        ]);
      }

      await loadConversations();
    } catch (error) {
      console.error("Chat request failed:", error);

      setError(
        "WorkMate AI could not process your request. Please check that the backend is running and try again.",
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong while processing your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(message) {
    handleSend(null, message);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)] md:h-[calc(100vh-48px)] min-h-[600px] max-w-7xl overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50/90 ${
            isMobileSidebarOpen
              ? "fixed inset-y-0 left-0 z-50 flex bg-white shadow-2xl"
              : "hidden md:flex"
          }`}
        >
          {/* Sidebar Header */}
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-sm font-bold text-slate-900">
                    WorkMate AI
                  </h1>
                  <p className="text-xs text-slate-500">Employee Assistant</p>
                </div>
              </div>

              {isMobileSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mb-2.5 flex items-center justify-between px-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Conversations
              </p>

              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {conversations.length}
              </span>
            </div>

            {conversations.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-6 text-center">
                <MessageSquare className="mx-auto mb-1.5 h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-400">No conversations yet.</p>
              </div>
            )}

            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = conversation.thread_id === threadId;

                return (
                  <div
                    key={conversation.thread_id}
                    className={`group flex w-full items-center gap-1.5 rounded-xl border px-2 py-1.5 transition ${
                      isActive
                        ? "border-blue-200 bg-blue-50/80 text-blue-900"
                        : "border-transparent hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleConversationClick(conversation.thread_id)
                      }
                      disabled={loading}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 text-left cursor-pointer disabled:cursor-not-allowed"
                    >
                      <MessageSquare
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-blue-600" : "text-slate-400"
                        }`}
                      />

                      <p
                        className={`truncate text-xs font-medium sm:text-sm ${
                          isActive ? "text-blue-900" : "text-slate-700"
                        }`}
                      >
                        {conversation.title}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteConversation(conversation.thread_id)
                      }
                      disabled={loading}
                      aria-label={`Delete ${conversation.title}`}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-200 p-3 sm:p-4">
            <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-slate-600">
                  WorkMate AI is ready
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <ChatHeader
            onToggleSidebar={() =>
              setIsMobileSidebarOpen((prevState) => !prevState)
            }
            isMobileSidebarOpen={isMobileSidebarOpen}
          />

          {/* Error Banner */}
          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-3 sm:px-8">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                <p className="text-sm text-red-700">{error}</p>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <main
            className={`flex-1 overflow-y-auto bg-slate-50/50 px-4 py-6 sm:px-8 ${
              loading ? "cursor-not-allowed" : ""
            }`}
          >
            <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
              {/* Empty Chat */}
              {messages.length === 0 && !loading && (
                <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 sm:h-16 sm:w-16">
                    <Bot className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    How can I help?
                  </h2>

                  <p className="mt-2 max-w-md text-xs text-slate-500 sm:text-sm">
                    Ask WorkMate AI about company policies, your requests,
                    employee information, or IT and facilities support.
                  </p>

                  <div className="mt-6 grid w-full max-w-2xl gap-3 sm:mt-8 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAction(
                          "What is the company policy for leave?",
                        )
                      }
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <BookOpen className="mb-2 h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        Ask about company policy
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Get answers from company documents.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAction("Show me my current requests.")
                      }
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Ticket className="mb-2 h-5 w-5 text-indigo-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        Check my requests
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        See your open and active requests.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAction("Show me my employee profile.")
                      }
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <User className="mb-2 h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        Show my profile
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        View your employee information.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAction("I have an IT issue and need help.")
                      }
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Wrench className="mb-2 h-5 w-5 text-amber-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        Report an IT issue
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Get help with an IT problem.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  sources={message.sources || []}
                />
              ))}

              {loading && (
                <ChatMessage role="assistant" content="Thinking..." />
              )}

              {waitingForApproval && (
                <ChatMessage
                  role="assistant"
                  content="Waiting for reviewer approval..."
                />
              )}
            </div>
          </main>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
            <div className="mx-auto max-w-4xl">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                disabled={loading}
              />

              <p className="mt-2 text-center text-[11px] text-slate-400">
                WorkMate AI can help with HR, IT, Facilities, and company
                policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
