"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Trade = {
  id: string;
  user_id?: string | null;
  amount?: number | null;
  asset?: string | null;
  symbol?: string | null;
  direction?: string | null;
  type?: string | null;
  status?: string | null;
  result?: string | null;
  profit?: number | null;
  profit_loss?: number | null;
  entry_price?: number | null;
  exit_price?: number | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTrades();
  }, []);

  async function loadTrades() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Trades loading error:", error);
      setMessage(error.message);
      setTrades([]);
    } else {
      setTrades((data as Trade[]) || []);
    }

    setLoading(false);
  }

  function getAmount(trade: Trade) {
    const amount = Number(trade.amount ?? 0);

    return Number.isFinite(amount)
      ? amount.toFixed(2)
      : "0.00";
  }

  function getAsset(trade: Trade) {
    return (
      trade.asset ||
      trade.symbol ||
      trade.type ||
      "Trade"
    );
  }

  function getDirection(trade: Trade) {
    return (
      trade.direction ||
      trade.type ||
      "N/A"
    );
  }

  function getProfit(trade: Trade) {
    const value =
      trade.profit ??
      trade.profit_loss ??
      null;

    if (value === null || value === undefined) {
      return "N/A";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "N/A";
    }

    return number.toFixed(2);
  }

  const statuses = useMemo(() => {
    const values = trades
      .map((trade) => trade.status)
      .filter(
        (status): status is string =>
          typeof status === "string" && status.length > 0
      );

    return Array.from(new Set(values));
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        String(trade.id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(trade.user_id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(getAsset(trade))
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        trade.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trades, search, statusFilter]);

  const pendingCount = trades.filter(
    (trade) =>
      String(trade.status || "").toLowerCase() ===
      "pending"
  ).length;

  const completedCount = trades.filter((trade) => {
    const status = String(trade.status || "").toLowerCase();

    return (
      status === "completed" ||
      status === "closed" ||
      status === "won" ||
      status === "lost"
    );
  }).length;

  const totalVolume = trades.reduce((total, trade) => {
    const amount = Number(trade.amount || 0);

    return Number.isFinite(amount)
      ? total + amount
      : total;
  }, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-6">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-purple-400">
              Manage Trades
            </h1>

            <p className="text-slate-400 mt-2">
              Monitor trading activity across the platform.
            </p>
          </div>

          <button
            onClick={loadTrades}
            className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-semibold"
          >
            Refresh Trades
          </button>

        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Total Trades
            </p>

            <h2 className="text-3xl font-bold text-purple-400 mt-2">
              {trades.length}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Pending
            </p>

            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              {pendingCount}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Completed
            </p>

            <h2 className="text-3xl font-bold text-green-400 mt-2">
              {completedCount}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Trade Volume
            </p>

            <h2 className="text-2xl font-bold text-blue-400 mt-2">
              ${totalVolume.toFixed(2)}
            </h2>
          </div>

        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search trade ID, user ID or asset..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              >
                <option value="All">
                  All statuses
                </option>

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Error */}
        {message && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-6">
            {message}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-slate-400">
            Loading trades...
          </div>
        )}

        {/* Empty */}
        {!loading &&
          filteredTrades.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <p className="text-slate-400">
                No trades found.
              </p>
            </div>
          )}

        {/* Trade cards */}
        {!loading &&
          filteredTrades.length > 0 && (
            <div className="space-y-4">

              {filteredTrades.map((trade) => {

                const status =
                  String(trade.status || "Unknown");

                const direction =
                  String(getDirection(trade));

                const directionLower =
                  direction.toLowerCase();

                const statusLower =
                  status.toLowerCase();

                const directionClass =
                  directionLower.includes("buy") ||
                  directionLower.includes("up") ||
                  directionLower.includes("call")
                    ? "text-green-400"
                    : directionLower.includes("sell") ||
                      directionLower.includes("down") ||
                      directionLower.includes("put")
                    ? "text-red-400"
                    : "text-slate-300";

                const statusClass =
                  statusLower === "pending"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                    : statusLower === "approved" ||
                        statusLower === "completed" ||
                        statusLower === "closed" ||
                        statusLower === "won"
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : statusLower === "rejected" ||
                        statusLower === "lost"
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700";

                return (
                  <div
                    key={trade.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                  >

                    {/* Top row */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-xl font-bold text-white">
                            {String(getAsset(trade))}
                          </h2>

                          <span
                            className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusClass}`}
                          >
                            {status}
                          </span>

                        </div>

                        <p className="text-xs text-slate-500 mt-2 break-all">
                          Trade ID: {trade.id}
                        </p>

                      </div>

                      <div className="text-left md:text-right">

                        <p className="text-xs text-slate-500">
                          AMOUNT
                        </p>

                        <p className="text-2xl font-bold text-blue-400">
                          ${getAmount(trade)}
                        </p>

                      </div>

                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">

                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500">
                          USER
                        </p>

                        <p className="text-sm text-slate-300 break-all mt-1">
                          {trade.user_id || "N/A"}
                        </p>
                      </div>

                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500">
                          DIRECTION
                        </p>

                        <p
                          className={`text-sm font-bold mt-1 ${directionClass}`}
                        >
                          {direction}
                        </p>
                      </div>

                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500">
                          PROFIT / LOSS
                        </p>

                        <p className="text-sm font-bold text-green-400 mt-1">
                          {getProfit(trade) === "N/A"
                            ? "N/A"
                            : `$${getProfit(trade)}`}
                        </p>
                      </div>

                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-xs text-slate-500">
                          DATE
                        </p>

                        <p className="text-sm text-slate-300 mt-1">
                          {trade.created_at
                            ? new Date(
                                trade.created_at
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>

                    </div>

                    {/* Prices */}
                    {(trade.entry_price !== undefined ||
                      trade.exit_price !== undefined) && (
                      <div className="grid grid-cols-2 gap-4 mt-4">

                        <div className="bg-slate-800 rounded-xl p-4">
                          <p className="text-xs text-slate-500">
                            ENTRY PRICE
                          </p>

                          <p className="text-sm text-white mt-1">
                            {trade.entry_price ?? "N/A"}
                          </p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4">
                          <p className="text-xs text-slate-500">
                            EXIT PRICE
                          </p>

                          <p className="text-sm text-white mt-1">
                            {trade.exit_price ?? "N/A"}
                          </p>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        {/* Footer navigation */}
        <div className="mt-8 flex flex-wrap gap-3">

          <a
            href="/admin"
            className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-semibold"
          >
            ← Admin Dashboard
          </a>

          <a
            href="/admin/users"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
          >
            Manage Users
          </a>

          <a
            href="/admin/deposits"
            className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-semibold"
          >
            Manage Deposits
          </a>

          <a
            href="/admin/withdrawals"
            className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-semibold"
          >
            Manage Withdrawals
          </a>

        </div>

      </div>

    </main>
  );
}
