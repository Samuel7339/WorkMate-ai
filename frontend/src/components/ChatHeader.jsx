import { Bot, Menu, X, ShieldCheck } from "lucide-react";

function ChatHeader({ onToggleSidebar, isMobileSidebarOpen }) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 px-4 py-3.5 sm:px-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
              aria-label="Toggle navigation"
            >
              {isMobileSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              WorkMate AI
            </h1>

            <p className="text-xs text-slate-500 sm:text-sm">
              Employee Helpdesk Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* <a
            href="/approval"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            Approvals
          </a> */}

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300" />

            <span className="text-xs font-medium text-emerald-700">
              Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;