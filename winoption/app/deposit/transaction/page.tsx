"use client";

import { Suspense, useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

function TransactionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const depositId = searchParams.get("id");

  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [depositNetwork, setDepositNetwork] = useState("");

  useEffect(() => {
    async function checkDeposit() {
      if (!depositId) {
        setMessage("Deposit request not found.");
        setChecking(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("deposits")
        .select(
          "id, user_id, amount, network, status, transaction_hash"
        )
        .eq("id", depositId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("DEPOSIT CHECK ERROR:", error);

        setMessage("Deposit request not found.");
        setChecking(false);
        return;
      }

      setDepositAmount(data.amount);
      setDepositNetwork(data.network || "");

      if (data.transaction_hash) {
        setTransactionHash(data.transaction_hash);
      }

      setChecking(false);
    }

    checkDeposit();
  }, [depositId, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    const hash = transactionHash.trim();

    if (!hash) {
      setMessage("Please enter your transaction ID or hash.");
      return;
    }

    if (!depositId) {
      setMessage("Deposit request not found.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("deposits")
        .update({
          transaction_hash: hash,
        })
        .eq("id", depositId)
        .eq("user_id", user.id)
        .select();

      console.log("TRANSACTION UPDATE:", data);
      console.log("TRANSACTION ERROR:", error);

      if (error) {
        console.error("TRANSACTION UPDATE ERROR:", error);

        setMessage(
          error.message || "Failed to submit transaction."
        );

        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMessage(
          "Transaction could not be submitted. Please try again."
        );

        setLoading(false);
        return;
      }

      setMessage(
        "Transaction submitted successfully. Your deposit is now pending verification."
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 1800);
    } catch (error: any) {
      console.error("TRANSACTION ERROR:", error);

      setMessage(
        error?.message || "An unexpected error occurred."
      );

      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p>Loading deposit...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6">

          <h1 className="text-3xl font-bold text-green-400 mb-6">
            Transaction Details
          </h1>

          <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
            <p className="font-bold text-blue-300 mb-2">
              Submit Transaction ID / Hash
            </p>

            <p className="text-sm text-blue-100">
              After sending your USDT, paste the transaction ID
              or transaction hash below.
            </p>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-400">
              Deposit ID
            </p>

            <p className="text-sm break-all mt-1">
              {depositId || "-"}
            </p>
          </div>

          {depositAmount !== null && (
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-400">
                Deposit Amount
              </p>

              <p className="text-lg font-semibold mt-1">
                {depositAmount}
              </p>
            </div>
          )}

          {depositNetwork && (
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-400">
                Network
              </p>

              <p className="text-lg font-semibold mt-1">
                {depositNetwork}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2">
                Transaction ID / Hash
              </label>

              <textarea
                value={transactionHash}
                onChange={(e) =>
                  setTransactionHash(e.target.value)
                }
                placeholder="Paste your transaction ID or hash"
                rows={6}
                required
                disabled={loading}
                className="w-full p-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg"
            >
              {loading
                ? "Submitting..."
                : "Submit Transaction"}
            </button>
          </form>

          {message && (
            <div className="mt-5 bg-slate-700 rounded-lg p-4 text-sm">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg"
          >
            Return to Home
          </button>

        </div>
      </div>
    </main>
  );
}

export default function TransactionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <div className="bg-slate-800 rounded-xl p-8">
            Loading transaction page...
          </div>
        </main>
      }
    >
      <TransactionPageContent />
    </Suspense>
  );
}
