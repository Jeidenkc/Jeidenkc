"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Deposit = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function DepositHistoryPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeposits();
  }, []);

  async function loadDeposits() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("deposits")
      .select("id, amount, status, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setDeposits(data || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold text-green-400 mb-8">
        Deposit History
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : deposits.length === 0 ? (
        <p>No deposits found.</p>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="bg-slate-800 rounded-xl p-5 flex justify-between items-center"
            >
              <div>
                <h2 className="text-xl font-bold">
                  ${deposit.amount}
                </h2>

                <p className="text-gray-400">
                  {new Date(deposit.created_at).toLocaleString()}
                </p>
              </div>

              <span className="bg-yellow-500 text-black px-4 py-2 rounded-lg">
                {deposit.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
