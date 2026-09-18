function ChatInput({ value, onChange, onSubmit }) {
  return (
    <div className="border-t border-gray-200 p-4">
      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask WorkMate AI..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInput;