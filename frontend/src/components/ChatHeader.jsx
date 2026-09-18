function ChatHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-200">
            W
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              WorkMate AI
            </h1>

            <p className="text-sm text-slate-500">
              Employee Helpdesk Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300" />

          <span className="text-xs font-medium text-emerald-700">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;