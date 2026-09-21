
import ReactMarkdown from "react-markdown";
import { Bot, User, FileText, Loader2, Clock } from "lucide-react";

function ChatMessage({ role, content, sources = [] }) {
  const isUser = role === "user";
  const isThinking = content === "Thinking...";
  const isApprovalWaiting = content === "Waiting for reviewer approval...";

  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </p>
        ) : isThinking ? (
          <div className="flex items-center gap-2.5 py-1 text-slate-500">
            <Loader2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">WorkMate AI is thinking...</span>
          </div>
        ) : isApprovalWaiting ? (
          <div className="flex items-center gap-2.5 py-1 text-amber-700">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">Waiting for reviewer approval...</span>
          </div>
        ) : (
          <>
            <div className="text-sm leading-relaxed text-slate-800">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2.5 list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2.5 list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  code: ({ children }) => (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800">
                      {children}
                    </code>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {sources.length > 0 && (
              <div className="mt-3.5 border-t border-slate-100 pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Sources Referenced
                </p>

                <div className="flex flex-wrap gap-2">
                  {sources.map((source, index) => {
                    const filename = source.source
                      ? source.source.split(/[\\/]/).pop()
                      : "Unknown source";

                    const page =
                      source.page !== undefined && source.page !== null
                        ? Number(source.page) + 1
                        : null;

                    return (
                      <div
                        key={`${filename}-${page}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-700">{filename}</span>
                        {page ? (
                          <span className="rounded bg-slate-200/80 px-1 py-0.5 text-[10px] font-semibold text-slate-600">
                            p. {page}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shadow-sm">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

export default ChatMessage;

