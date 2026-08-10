"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  created_at: string;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadWithdrawals();
  }, []);

  async function loadWithdrawals() {
    setLoading(true);

    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load withdrawals error:", error);
      setMessage(`Error loading withdrawals: ${error.message}`);
      setLoading(false);
      return;
    }

    setWithdrawals((data as Withdrawal[]) || []);
    setLoading(false);
  }

  async function updateStatus(
    id: string,
    newStatus: "Approved" | "Rejected"
  ) {
    if (updating !== null) {
      return;
    }

    setUpdating(id);
    setMessage("");

    console.log("=================================");
    console.log("WITHDRAWAL UPDATE");
    console.log("Withdrawal ID:", id);
    console.log("New status:", newStatus);
    console.log("=================================");

    try {
      /*
       * IMPORTANT:
       * We deliberately DO NOT use .single().
       *
       * The previous PGRST116 error happened because
       * Supabase was being asked to convert an empty
       * result into one JSON object.
       */

      const { data, error } = await supabase
        .from("withdrawals")
        .update({
          status: newStatus,
        })
        .eq("id", id)
        .select("id, status");

      if (error) {
        console.error("SUPABASE UPDATE ERROR:", error);

        setMessage(
          `Update failed: ${error.message}`
        );

        setUpdating(null);
        return;
      }

      console.log("Update returned:", data);

      /*
       * If Supabase returns no updated row, the database
       * did not allow the update or the ID did not match.
       */
      if (!data || data.length === 0) {
        console.error(
          "No withdrawal was updated.",
          "This usually means the Supabase UPDATE policy is blocking the request."
        );

        setMessage(
          "Update failed: Supabase did not update this withdrawal. Check the withdrawals UPDATE policy."
        );

        setUpdating(null);
        return;
      }

      /*
       * Verify the returned status.
       */
      const updatedRow = data[0];

      if (
        String(updatedRow.status).trim().toLowerCase() !==
        newStatus.toLowerCase()
      ) {
        console.error(
          "Status verification failed.",
          "Expected:",
          newStatus,
          "Received:",
          updatedRow.status
        );

        setMessage(
          `Update verification failed. Database returned: ${updatedRow.status}`
        );

        setUpdating(null);
        return;
      }

      /*
       * Update the local screen immediately.
       */
      setWithdrawals((current) =>
        current.map((withdrawal) =>
          withdrawal.id === id
            ? {
                ...withdrawal,
                status: newStatus,
              }
            : withdrawal
        )
      );

      setMessage(
        `Withdrawal successfully ${newStatus.toLowerCase()}.`
      );

      /*
       * Load again from Supabase.
       * This makes the database the source of truth.
       */
      await loadWithdrawals();
    } catch (error) {
      console.error(
        "Unexpected withdrawal update error:",
        error
      );

      if (error instanceof Error) {
        setMessage(
          `Update failed: ${error.message}`
        );
      } else {
        setMessage("Update failed.");
      }
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xl">
            Loading withdrawals...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Manage Withdrawals
            </h1>

            <p className="text-gray-400 mt-2">
              Review and manage user withdrawal requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadWithdrawals}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-semibold"
          >
            Refresh
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-5 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm">
              {message}
            </p>
          </div>
        )}

        {/* NO WITHDRAWALS */}
        {withdrawals.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">
              No withdrawal requests found.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {withdrawals.map((withdrawal) => {

              /*
               * Normalize status so:
               *
               * Pending
               * pending
               * PROCESSING
               * Processing
               *
               * can all be checked safely.
               */
              const normalizedStatus = String(
                withdrawal.status || ""
              )
                .trim()
                .toLowerCase();

              /*
               * BOTH Pending AND Processing can be managed.
               */
              const canManage =
                normalizedStatus === "pending" ||
                normalizedStatus === "processing";

              const isApproved =
                normalizedStatus === "approved";

              const isRejected =
                normalizedStatus === "rejected";

              return (
                <div
                  key={withdrawal.id}
                  className="bg-slate-800 rounded-xl p-5 md:p-6 shadow-lg"
                >

                  {/* WITHDRAWAL INFORMATION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                    {/* AMOUNT */}
                    <div>
                      <p className="text-gray-400 text-sm">
                        Amount
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        $
                        {Number(
                          withdrawal.amount
                        ).toFixed(2)}
                      </p>
                    </div>

                    {/* STATUS */}
                    <div>
                      <p className="text-gray-400 text-sm">
                        Status
                      </p>

                      <p
                        className={`font-bold mt-1 ${
                          isApproved
                            ? "text-green-400"
                            : isRejected
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {withdrawal.status}
                      </p>
                    </div>

                    {/* REQUESTED */}
                    <div>
                      <p className="text-gray-400 text-sm">
                        Requested
                      </p>

                      <p className="text-sm mt-1">
                        {new Date(
                          withdrawal.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    {/* USER ID */}
                    <div>
                      <p className="text-gray-400 text-sm">
                        User ID
                      </p>

                      <p className="break-all text-sm mt-1">
                        {withdrawal.user_id}
                      </p>
                    </div>
                  </div>

                  {/* WALLET ADDRESS */}
                  <div className="mt-5">
                    <p className="text-gray-400 text-sm">
                      Wallet Address
                    </p>

                    <p className="break-all text-sm mt-1 bg-slate-900 rounded-lg p-3">
                      {withdrawal.wallet_address}
                    </p>
                  </div>

                  {/* WITHDRAWAL ID */}
                  <div className="mt-5">
                    <p className="text-gray-400 text-sm">
                      Withdrawal ID
                    </p>

                    <p className="break-all text-xs text-gray-300 mt-1">
                      {withdrawal.id}
                    </p>
                  </div>

                  {/* APPROVE / REJECT BUTTONS */}
                  {canManage && (
                    <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-slate-700">

                      {/* APPROVE */}
                      <button
                        type="button"
                        disabled={
                          updating === withdrawal.id
                        }
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "Approved"
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed px-5 py-3 rounded-lg font-semibold"
                      >
                        {updating === withdrawal.id
                          ? "Updating..."
                          : "Approve"}
                      </button>

                      {/* REJECT */}
                      <button
                        type="button"
                        disabled={
                          updating === withdrawal.id
                        }
                        onClick={() =>
                          updateStatus(
                            withdrawal.id,
                            "Rejected"
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed px-5 py-3 rounded-lg font-semibold"
                      >
                        {updating === withdrawal.id
                          ? "Updating..."
                          : "Reject"}
                      </button>

                    </div>
                  )}

                  {/* APPROVED */}
                  {isApproved && (
                    <div className="mt-6 pt-5 border-t border-slate-700">
                      <p className="text-green-400 font-semibold">
                        Withdrawal approved.
                      </p>
                    </div>
                  )}

                  {/* REJECTED */}
                  {isRejected && (
                    <div className="mt-6 pt-5 border-t border-slate-700">
                      <p className="text-red-400 font-semibold">
                        Withdrawal rejected.
                      </p>
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}
