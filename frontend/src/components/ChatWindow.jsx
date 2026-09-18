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
    <div className="flex min-h-screen bg-gray-50 p-4">
      <div className="mx-auto flex h-[700px] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg">

        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r border-gray-200">

          <div className="border-b border-gray-200 p-4">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Conversations
            </p>

            {conversations.length === 0 && (
              <p className="px-2 text-sm text-gray-400">
                No conversations yet.
              </p>
            )}

            <div className="space-y-1">
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
                    className={`w-full rounded-lg px-3 py-3 text-left text-sm ${
                      isActive
                        ? "bg-gray-100 font-medium text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <p className="truncate">
                      {conversation.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader />

          <main className="flex-1 space-y-4 overflow-y-auto p-6">
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
          </main>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;