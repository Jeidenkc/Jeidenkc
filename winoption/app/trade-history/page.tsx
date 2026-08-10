"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Trade = {
  id: string;
  asset: string;
  direction: string;
  amount: number;
  profit: number | null;
  status: string;
  result: string | null;
  opened_at: string;
  closed_at: string | null;
};

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  async function loadTrades() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setTrades(data || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-4xl font-bold text-green-400 mb-6">
        Trade History
      </h1>

      {loading && <p>Loading...</p>}

      {!loading && trades.length === 0 && (
        <p>No trades found.</p>
      )}

      <div className="space-y-4">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="bg-slate-800 rounded-xl p-4"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {trade.asset}
                </h2>

                <p className="text-gray-400">
                  {trade.direction}
                </p>

                <p className="mt-2">
                  Amount: ${trade.amount}
                </p>

                <p>
                  Profit: $
                  {trade.profit ?? 0}
                </p>

                <p className="text-sm text-gray-400 mt-2">
                  Opened:
                  <br />
                  {new Date(
                    trade.opened_at
                  ).toLocaleString()}
                </p>

                {trade.closed_at && (
                  <p className="text-sm text-gray-400">
                    Closed:
                    <br />
                    {new Date(
                      trade.closed_at
                    ).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                {trade.status === "Pending" && (
                  <span className="bg-yellow-500 text-black px-4 py-2 rounded-lg">
                    Pending
                  </span>
                )}

                {trade.result === "Win" && (
                  <span className="bg-green-500 text-white px-4 py-2 rounded-lg">
                    Win
                  </span>
                )}

                {trade.result === "Loss" && (
                  <span className="bg-red-500 text-white px-4 py-2 rounded-lg">
                    Loss
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
