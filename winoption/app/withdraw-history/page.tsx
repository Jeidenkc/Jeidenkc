"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Withdrawal = {
  id: string;
  amount: number;
  wallet_address: string;
  status: string;
  created_at: string;
};

export default function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  async function loadWithdrawals() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setWithdrawals(data || []);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold text-green-400 mb-8">
        Withdrawal History
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : withdrawals.length === 0 ? (
        <p>No withdrawal requests found.</p>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="bg-slate-800 rounded-xl p-5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold">
                    ${withdrawal.amount}
                  </p>

                  <p className="text-gray-400">
                    {withdrawal.wallet_address}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(
                      withdrawal.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`px-4 py-2 rounded-lg ${
                    withdrawal.status === "Approved"
                      ? "bg-green-600"
                      : withdrawal.status === "Rejected"
                      ? "bg-red-600"
                      : "bg-yellow-500 text-black"
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
