"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [users, setUsers] = useState(0);
  const [deposits, setDeposits] = useState(0);
  const [withdrawals, setWithdrawals] = useState(0);
  const [trades, setTrades] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: depositCount } = await supabase
      .from("deposits")
      .select("*", { count: "exact", head: true });

    const { count: withdrawalCount } = await supabase
      .from("withdrawals")
      .select("*", { count: "exact", head: true });

    const { count: tradeCount } = await supabase
      .from("trades")
      .select("*", { count: "exact", head: true });

    setUsers(userCount || 0);
    setDeposits(depositCount || 0);
    setWithdrawals(withdrawalCount || 0);
    setTrades(tradeCount || 0);
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-4xl font-bold text-green-400 mb-2">
            Admin Dashboard
          </h1>

          <p className="text-gray-400 mb-8">
            Platform Overview
          </p>

          <div className="grid md:grid-cols-4 gap-5 mb-10">

            <div className="bg-slate-800 rounded-2xl p-6">
              <p className="text-gray-400">Users</p>
              <h2 className="text-5xl font-bold text-green-400 mt-3">
                {users}
              </h2>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6">
              <p className="text-gray-400">Deposits</p>
              <h2 className="text-5xl font-bold text-blue-400 mt-3">
                {deposits}
              </h2>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6">
              <p className="text-gray-400">Withdrawals</p>
              <h2 className="text-5xl font-bold text-red-400 mt-3">
                {withdrawals}
              </h2>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6">
              <p className="text-gray-400">Trades</p>
              <h2 className="text-5xl font-bold text-purple-400 mt-3">
                {trades}
              </h2>
            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <Link
              href="/admin/deposits"
              className="bg-green-600 hover:bg-green-700 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold">
                Manage Deposits
              </h2>
            </Link>

            <Link
              href="/admin/withdrawals"
              className="bg-red-600 hover:bg-red-700 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold">
                Manage Withdrawals
              </h2>
            </Link>

            <Link
              href="/admin/users"
              className="bg-blue-600 hover:bg-blue-700 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold">
                Manage Users
              </h2>
            </Link>

            <Link
              href="/admin/trades"
              className="bg-purple-600 hover:bg-purple-700 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold">
                Manage Trades
              </h2>
            </Link>

          </div>

        </div>
      </main>
    </AdminGuard>
  );
}
