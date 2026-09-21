
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
  User,
  Building2,
  History,
  CheckCircle2,
  XCircle,
  Hash,
  AlertCircle,
  Loader2,
} from "lucide-react";

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

      const errorMsg = "Unable to load approval requests.";
      setMessage(errorMsg);
      toast.error(errorMsg);
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

      const errorMsg = "Unable to load approval history.";
      setMessage(errorMsg);
      toast.error(errorMsg);
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

        const successMsg = ticketId
          ? `Request approved. Request ID: ${ticketId} has been created.`
          : "Request approved successfully.";

        setMessage(successMsg);
        toast.success(successMsg);
      } else {
        const rejectMsg = "Request rejected. No action was created.";
        setMessage(rejectMsg);
        toast.info(rejectMsg);
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

      const errorMsg = "Unable to process the approval request.";
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                  WorkMate AI Reviewer Portal
                </h1>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                  {approvals.length} Pending
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500">
                Review and authorize privileged IT and HR action requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">

            <button
              type="button"
              onClick={handleHistoryClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <History className="h-3.5 w-3.5" />
              {showHistory ? "Hide History" : "View History"}
            </button>
          </div>
        </div>

        {/* Approval History */}
        {showHistory && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Approval History
                </h2>
                <p className="text-xs text-slate-500">
                  Previously approved and rejected requests.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {history.length} records
              </span>
            </div>

            {historyLoading && (
              <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 text-blue-600" />
                <span>Loading approval history...</span>
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                <p className="text-xs text-slate-400">No approval history found.</p>
              </div>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="space-y-3">
                {history.map((approval) => (
                  <div
                    key={approval.approval_id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {approval.action}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          approval.status === "approved"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : approval.status === "rejected"
                            ? "border border-rose-200 bg-rose-50 text-rose-700"
                            : "border border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {approval.status === "approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : approval.status === "rejected" ? (
                          <XCircle className="h-3 w-3" />
                        ) : null}
                        <span className="capitalize">{approval.status}</span>
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        Employee:{" "}
                        <strong className="font-medium text-slate-700">
                          {approval.employee_id}
                        </strong>
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        Department:{" "}
                        <strong className="font-medium text-slate-700">
                          {approval.department}
                        </strong>
                      </span>

                      {approval.request_id && (
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3 w-3 text-slate-400" />
                          Request ID:{" "}
                          <strong className="font-medium text-slate-700">
                            {approval.request_id}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 rounded-lg border border-slate-200/60 bg-white p-2.5 text-xs text-slate-700 leading-relaxed">
                      {approval.description}
                    </div>

                    {(approval.created_at || approval.updated_at) && (
                      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                        {approval.created_at && (
                          <span>Created: {approval.created_at}</span>
                        )}
                        {approval.updated_at && (
                          <span>Updated: {approval.updated_at}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading Pending Approvals */}
        {loading && (
          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 text-blue-600" />
            <span>Loading approval requests...</span>
          </div>
        )}

        {/* No Pending Approvals */}
        {!loading && approvals.length === 0 && !message && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h2 className="text-base font-semibold text-slate-900">
              No pending approvals
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              All requests have been reviewed. There are currently no items
              waiting for approval.
            </p>
          </div>
        )}

        {/* Pending Approvals */}
        {approvals.map((approval) => (
          <div
            key={approval.thread_id}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="mb-1.5 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  Authorization Required
                </span>

                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {approval.action}
                </h2>
              </div>
            </div>

            <div className="mb-5 space-y-3 text-sm">
              <div className="flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-semibold text-slate-800">
                    {approval.employee_id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">
                    {approval.department}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </p>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-sm text-slate-800 leading-relaxed">
                  {approval.description}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={processingId === approval.thread_id}
                onClick={() =>
                  handleDecision(approval.thread_id, "approved")
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId === approval.thread_id ? (
                  <>
                    <Loader2 className="h-4 w-4" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={processingId === approval.thread_id}
                onClick={() =>
                  handleDecision(approval.thread_id, "rejected")
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}

        {/* Message */}
        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-sm text-slate-700">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalPage;

