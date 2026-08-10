"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeposits();
  }, []);

  async function loadDeposits() {
    setLoading(true);

    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setDeposits(data || []);
    setLoading(false);
  }

  async function updateStatus(
    id: string,
    status: "Approved" | "Rejected"
  ) {
    try {
      const rpcName =
        status === "Approved" ? "approve_deposit" : "reject_deposit";

      const { error } = await supabase.rpc(rpcName, {
        p_deposit_id: id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert(`Deposit ${status.toLowerCase()} successfully!`);
      await loadDeposits();
    } catch (err) {
      console.error(err);
      alert("Unexpected error occurred.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-green-400 mb-8">
          Manage Deposits
        </h1>

        {deposits.length === 0 && (
          <div className="text-center text-gray-400">
            No deposits found.
          </div>
        )}

        <div className="space-y-5">
          {deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="bg-slate-800 rounded-xl p-6 flex justify-between items-center"
            >
              <div>
                <h2 className="text-2xl font-bold text-green-400">
                  ${Number(deposit.amount).toFixed(2)}
                </h2>

                <p className="text-gray-400 break-all">
                  {deposit.user_id}
                </p>

                <p className="text-gray-500">
                  {new Date(deposit.created_at).toLocaleString()}
                </p>

                <p className="mt-3">
                  Status:
                  <span className="ml-2 font-bold">
                    {deposit.status}
                  </span>
                </p>
              </div>

              {deposit.status === "Pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus(deposit.id, "Approved")}
                    className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(deposit.id, "Rejected")}
                    className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-bold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
