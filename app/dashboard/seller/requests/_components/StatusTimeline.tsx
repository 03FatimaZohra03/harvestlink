"use client";

type Status = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";

type Props = {
  status: Status;
  createdAt: string;
  respondedAt: string | null;
  completedAt: string | null;
};

type Step = {
  key: string;
  label: string;
  timestamp: string | null;
  reached: boolean;
  rejected?: boolean;
};

export default function StatusTimeline({ status, createdAt, respondedAt, completedAt }: Props) {
  // Build the timeline steps based on the current status
  const steps: Step[] = [];

  // Step 1: Created (always reached)
  steps.push({
    key: "created",
    label: "Request sent",
    timestamp: createdAt,
    reached: true,
  });

  // Step 2: Responded (Pending → Accepted or Rejected)
  const isResponded = status === "ACCEPTED" || status === "REJECTED" || status === "COMPLETED";
  const isRejected = status === "REJECTED";
  steps.push({
    key: "responded",
    label: isRejected ? "Rejected" : "Accepted",
    timestamp: respondedAt,
    reached: isResponded,
    rejected: isRejected,
  });

  // Step 3: Completed (only if ACCEPTED → COMPLETED)
  if (!isRejected && status !== "CANCELLED") {
    steps.push({
      key: "completed",
      label: "Completed",
      timestamp: completedAt,
      reached: status === "COMPLETED",
    });
  }

  // Step 4: Cancelled (only if CANCELLED)
  if (status === "CANCELLED") {
    steps.push({
      key: "cancelled",
      label: "Cancelled by buyer",
      timestamp: respondedAt,
      reached: true,
      rejected: true,
    });
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + dot column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${step.reached ? (step.rejected ? "bg-red-500" : "bg-green-600") : "bg-gray-300"} ${i === 0 ? "mt-1" : ""}`}
              />
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[40px] ${step.reached ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
            {/* Label column */}
            <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
              <div className={`text-sm font-medium ${step.reached ? (step.rejected ? "text-red-700" : "text-gray-900") : "text-gray-400"}`}>
                {step.label}
              </div>
              {step.timestamp && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {new Date(step.timestamp).toLocaleString()}
                </div>
              )}
              {!step.reached && (
                <div className="text-xs text-gray-400 mt-0.5">Pending</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
