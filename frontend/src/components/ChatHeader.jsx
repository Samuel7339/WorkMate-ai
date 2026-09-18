function ChatHeader() {
  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            WorkMate AI
          </h1>

          <p className="text-sm text-gray-500">
            Employee Helpdesk Assistant
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

          <span className="text-sm text-gray-600">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;