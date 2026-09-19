
import { useEffect, useState } from "react";

function ApprovalPage() {
  const [approvals, setApprovals] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadApprovals() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/approvals"
      );

      if (!response.ok) {
        throw new Error("Failed to load approvals");
      }

      const data = await response.json();

      setApprovals(data);
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to load approval requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/approval-history"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load approval history"
        );
      }

      const data = await response.json();

      setHistory(data);
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to load approval history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  async function handleHistoryClick() {
    const nextState = !showHistory;

    setShowHistory(nextState);

    if (nextState) {
      await loadHistory();
    }
  }

  async function handleDecision(
    threadId,
    decision
  ) {
    if (processingId) {
      return;
    }

    setProcessingId(threadId);
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/approval",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            thread_id: threadId,
            decision,
            employee_id: "EMP001",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to process approval"
        );
      }

      const data = await response.json();

      if (decision === "approved") {
        const ticketId =
          data.result?.ticket?.ticket_id ||
          data.result?.request?.request_id ||
          data.request_id;

        setMessage(
          ticketId
            ? `Request approved. Request ID: ${ticketId} has been created.`
            : "Request approved successfully."
        );
      } else {
        setMessage(
          "Request rejected. No action was created."
        );
      }

      setApprovals((current) =>
        current.filter(
          (approval) =>
            approval.thread_id !== threadId
        )
      );

      // Refresh history if it is currently visible.
      if (showHistory) {
        await loadHistory();
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to process the approval request."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">

        {/* Header */}

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            WorkMate AI
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Reviewer Approval
          </p>
        </div>

        {/* History Button */}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleHistoryClick}
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            {showHistory
              ? "Hide Approval History"
              : "View Approval History"}
          </button>
        </div>

        {/* Approval History */}

        {showHistory && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Approval History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Previously approved and rejected requests.
              </p>
            </div>

            {historyLoading && (
              <p className="text-sm text-gray-500">
                Loading approval history...
              </p>
            )}

            {!historyLoading &&
              history.length === 0 && (
                <p className="text-sm text-gray-500">
                  No approval history found.
                </p>
              )}

            {!historyLoading &&
              history.length > 0 && (
                <div className="space-y-4">
                  {history.map((approval) => (
                    <div
                      key={approval.approval_id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <p className="font-medium text-gray-900">
                            {approval.action}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Employee:{" "}
                            {approval.employee_id}
                          </p>

                          <p className="text-sm text-gray-500">
                            Department:{" "}
                            {approval.department}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            approval.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : approval.status ===
                                "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {approval.status}
                        </span>

                      </div>

                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-sm text-gray-700">
                          {approval.description}
                        </p>
                      </div>

                      {approval.request_id && (
                        <p className="mt-3 text-xs text-gray-500">
                          Request ID:{" "}
                          <span className="font-medium text-gray-700">
                            {approval.request_id}
                          </span>
                        </p>
                      )}

                      {approval.created_at && (
                        <p className="mt-1 text-xs text-gray-400">
                          Created:{" "}
                          {approval.created_at}
                        </p>
                      )}

                      {approval.updated_at && (
                        <p className="mt-1 text-xs text-gray-400">
                          Updated:{" "}
                          {approval.updated_at}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Loading Pending Approvals */}

        {loading && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading approval requests...
            </p>
          </div>
        )}

        {/* No Pending Approvals */}

        {!loading &&
          approvals.length === 0 &&
          !message && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                No pending approvals
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                There are currently no requests waiting
                for approval.
              </p>
            </div>
          )}

        {/* Pending Approvals */}

        {approvals.map((approval) => (
          <div
            key={approval.thread_id}
            className="mb-4 rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Approval Required
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review this request before allowing the
                action.
              </p>
            </div>

            <div className="space-y-4">

              <div>
                <p className="text-sm text-gray-500">
                  Action
                </p>

                <p className="font-medium text-gray-900">
                  {approval.action}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Employee
                </p>

                <p className="font-medium text-gray-900">
                  {approval.employee_id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Department
                </p>

                <p className="font-medium text-gray-900">
                  {approval.department}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Description
                </p>

                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                  {approval.description}
                </p>
              </div>

            </div>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                disabled={
                  processingId ===
                  approval.thread_id
                }
                onClick={() =>
                  handleDecision(
                    approval.thread_id,
                    "approved"
                  )
                }
                className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId ===
                approval.thread_id
                  ? "Processing..."
                  : "Approve"}
              </button>

              <button
                type="button"
                disabled={
                  processingId ===
                  approval.thread_id
                }
                onClick={() =>
                  handleDecision(
                    approval.thread_id,
                    "rejected"
                  )
                }
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>

            </div>
          </div>
        ))}

        {/* Message */}

        {message && (
          <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">
              {message}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default ApprovalPage;

