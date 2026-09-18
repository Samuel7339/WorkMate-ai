function ChatMessage({ role, content }) {
  const isUser = role === "user";

  return (
    <div
      className={`flex items-end gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md shadow-blue-200">
          W
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "rounded-br-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-100"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-6">
          {content}
        </p>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600">
          You
        </div>
      )}
    </div>
  );
}

export default ChatMessage;