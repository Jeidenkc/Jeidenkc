"use client";

import { useRouter } from "next/navigation";

export default function WithdrawalProcessingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 text-center">

          {/* Processing icon */}

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500">
            <span className="text-4xl">⏳</span>
          </div>

          {/* Title */}

          <h1 className="text-3xl font-bold text-yellow-400 mb-4">
            Withdrawal Processing
          </h1>

          {/* Main message */}

          <p className="text-slate-200 text-lg leading-7 mb-6">
            Your withdrawal request has been submitted
            successfully and is now being processed.
          </p>

          {/* Time information */}

          <div className="bg-slate-900 border border-yellow-600 rounded-xl p-5 mb-6">

            <p className="text-yellow-400 font-bold text-xl mb-2">
              Processing Time
            </p>

            <p className="text-slate-200">
              Withdrawals may take
              <strong> 1–24 hours </strong>
              to complete.
            </p>

          </div>

          {/* Status */}

          <div className="bg-blue-900/30 border border-blue-600 rounded-xl p-5 mb-6">

            <p className="text-blue-300 font-bold text-lg mb-2">
              Status: Processing
            </p>

            <p className="text-sm text-blue-100 leading-6">
              Your withdrawal is being handled by the
              administrator. Please wait while the
              transaction is processed.
            </p>

          </div>

          {/* Important notice */}

          <div className="bg-slate-900 rounded-xl p-4 mb-6">

            <p className="text-sm text-slate-400 leading-6">
              Do not submit the same withdrawal request
              again while this request is processing.
            </p>

          </div>

          {/* Back to dashboard */}

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full bg-green-500 hover:bg-green-600 p-4 rounded-lg font-bold text-lg transition"
          >
            Back to Dashboard
          </button>

        </div>

      </div>
    </main>
  );
}
