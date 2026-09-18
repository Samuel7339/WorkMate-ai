import { useEffect, useState } from "react";

function ApprovalPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadApprovals();
  }, []);

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
          data.result?.ticket?.ticket_id;

        setMessage(
          ticketId
            ? `Request approved. IT ticket ${ticketId} has been created.`
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            WorkMate AI
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Reviewer Approval
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading approval requests...
            </p>
          </div>
        )}

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
                  processingId === approval.thread_id
                }
                onClick={() =>
                  handleDecision(
                    approval.thread_id,
                    "approved"
                  )
                }
                className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId === approval.thread_id
                  ? "Processing..."
                  : "Approve"}
              </button>

              <button
                type="button"
                disabled={
                  processingId === approval.thread_id
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