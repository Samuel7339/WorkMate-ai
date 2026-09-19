import { useEffect, useState } from "react";

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
  }

  async function handleDeleteConversation(selectedThreadId) {
    if (loading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?",
    );

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
    } catch (error) {
      console.error("Failed to delete conversation:", error);

      setError("Could not delete the conversation. Please try again.");
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
    <div className="min-h-screen bg-slate-100 px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex h-[calc(100vh-24px)] min-h-[620px] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 sm:h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-slate-50/80 md:flex">
          {/* Sidebar Header */}
          <div className="border-b border-slate-200 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                W
              </div>

              <div>
                <h1 className="text-sm font-bold text-slate-900">
                  WorkMate AI
                </h1>

                <p className="text-xs text-slate-500">Employee assistant</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.99]"
            >
              <span className="text-lg leading-none">+</span>
              New Chat
            </button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Conversations
              </p>

              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {conversations.length}
              </span>
            </div>

            {conversations.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-5 text-center">
                <p className="text-xs text-slate-400">No conversations yet.</p>
              </div>
            )}

            <div className="space-y-1.5">
              {conversations.map((conversation) => {
                const isActive = conversation.thread_id === threadId;

                return (
                  <div
                    key={conversation.thread_id}
                    className={`group flex w-full items-center gap-2 rounded-xl border px-2 py-2 transition ${
                      isActive
                        ? "border-blue-200 bg-blue-50"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleConversationClick(conversation.thread_id)
                      }
                      disabled={loading}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1.5 text-left"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                        C
                      </div>

                      <p className="truncate text-sm font-medium text-slate-700">
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
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>

                <span className="text-xs font-medium text-slate-600">
                  WorkMate AI is ready
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <ChatHeader />

          {/* Error */}
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

          {/* Messages */}
          <main className="flex-1 overflow-y-auto bg-slate-50/50 px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-4xl space-y-5">
              {/* Empty Chat */}
              {messages.length === 0 && !loading && (
                <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
                    W
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900">
                    How can I help?
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Ask WorkMate AI about company policies, your requests,
                    employee information, or IT and facilities support.
                  </p>

                  <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAction(
                          "What is the company policy for leave?",
                        )
                      }
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 text-xl">📄</div>

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
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 text-xl">🎫</div>

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
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 text-xl">👤</div>

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
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 text-xl">🔧</div>

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
          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
            <div className="mx-auto max-w-4xl">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
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
