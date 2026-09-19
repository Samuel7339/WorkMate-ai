
import ReactMarkdown from "react-markdown";

function ChatMessage({ role, content, sources = [] }) {
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
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-6">
            {content}
          </p>
        ) : (
          <>
            <div className="text-sm leading-6">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {sources.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">
                  Sources
                </p>

                <div className="space-y-1">
                  {sources.map((source, index) => {
                    const filename = source.source
                      ? source.source.split(/[\\/]/).pop()
                      : "Unknown source";

                    const page =
                      source.page !== undefined && source.page !== null
                        ? Number(source.page) + 1
                        : null;

                    return (
                      <p
                        key={`${filename}-${page}-${index}`}
                        className="text-xs text-slate-500"
                      >
                        📄 {filename}
                        {page ? ` — Page ${page}` : ""}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
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

