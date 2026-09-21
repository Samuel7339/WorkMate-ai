import { Send } from "lucide-react";

function ChatInput({ value, onChange, onSubmit, disabled = false }) {
  const isInputEmpty = !value || !value.trim();

  return (
    <div className="border-t border-slate-200/80 bg-white p-3 sm:p-4">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-4xl items-center gap-2.5 sm:gap-3"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder="Ask WorkMate AI about policies, tickets, profile, or support..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || isInputEmpty}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3.5"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

export default ChatInput;