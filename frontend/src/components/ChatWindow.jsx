import { useEffect, useState } from "react";

import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingForApproval, setWaitingForApproval] =
    useState(false);

  const [threadId, setThreadId] = useState(() => {
    const existingThreadId = localStorage.getItem(
      "workmate_thread_id"
    );

    if (existingThreadId) {
      return existingThreadId;
    }

    const newThreadId = crypto.randomUUID();

    localStorage.setItem(
      "workmate_thread_id",
      newThreadId
    );

    return newThreadId;
  });

  async function loadConversations() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/conversations"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load conversations"
        );
      }

      const data = await response.json();

      setConversations(data);
    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error
      );
    }
  }

  async function loadHistory(selectedThreadId) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/chat-history/${selectedThreadId}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load chat history"
        );
      }

      const data = await response.json();

      if (data.length > 0) {
        setMessages(data);
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm WorkMate AI. How can I help you today?",
          },
        ]);
      }
    } catch (error) {
      console.error(
        "Failed to load chat history:",
        error
      );

      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm WorkMate AI. How can I help you today?",
        },
      ]);
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
          `http://127.0.0.1:8000/approval-status/${threadId}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (
          data.status === "approved" ||
          data.status === "rejected"
        ) {
          setWaitingForApproval(false);

          if (data.status === "approved") {
            const ticketId =
              data.result?.ticket?.ticket_id;

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
                content:
                  "Your request was rejected. No IT ticket was created.",
              },
            ]);
          }
        }
      } catch (error) {
        console.error(
          "Approval status check failed:",
          error
        );
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [waitingForApproval, threadId]);

  function handleNewChat() {
    const newThreadId = crypto.randomUUID();

    localStorage.setItem(
      "workmate_thread_id",
      newThreadId
    );

    setWaitingForApproval(false);
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm WorkMate AI. How can I help you today?",
      },
    ]);

    setInput("");
    setThreadId(newThreadId);
  }

  function handleConversationClick(selectedThreadId) {
    if (loading) {
      return;
    }

    localStorage.setItem(
      "workmate_thread_id",
      selectedThreadId
    );

    setWaitingForApproval(false);
    setInput("");
    setThreadId(selectedThreadId);
  }

  async function handleSend(event) {
    event.preventDefault();

    if (!input.trim() || loading) {
      return;
    }

    const userMessage = input.trim();

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
      const response = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            thread_id: threadId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to get response from server"
        );
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
            content: data.answer,
          },
        ]);
      }

      await loadConversations();
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            "Sorry, I could not connect to the WorkMate AI server.",
        },
      ]);

      console.error(error);
    } finally {
      setLoading(false);
    }
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
                <p className="text-xs text-slate-500">
                  Employee assistant
                </p>
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
                <p className="text-xs text-slate-400">
                  No conversations yet.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              {conversations.map((conversation) => {
                const isActive =
                  conversation.thread_id === threadId;

                return (
                  <button
                    key={conversation.thread_id}
                    type="button"
                    onClick={() =>
                      handleConversationClick(
                        conversation.thread_id
                      )
                    }
                    className={`group w-full rounded-xl border px-3 py-3 text-left transition ${
                      isActive
                        ? "border-blue-100 bg-blue-50 text-blue-900 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                        }`}
                      >
                        C
                      </div>

                      <p className="truncate text-sm font-medium">
                        {conversation.title}
                      </p>
                    </div>
                  </button>
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

          {/* Messages */}
          <main className="flex-1 overflow-y-auto bg-slate-50/50 px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-4xl space-y-5">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}

              {loading && (
                <ChatMessage
                  role="assistant"
                  content="Thinking..."
                />
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
                WorkMate AI can help with HR, IT, Facilities, and company policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;