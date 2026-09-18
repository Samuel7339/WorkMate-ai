function ChatInput({ value, onChange, onSubmit }) {
  return (
    <div className="border-t border-slate-200/80 bg-white/90 p-4">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-4xl items-center gap-3"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder="Ask WorkMate AI..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 active:translate-y-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInput;