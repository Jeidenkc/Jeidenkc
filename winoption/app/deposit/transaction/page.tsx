"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const depositId = searchParams.get("id");

  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");

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
        .select("id, user_id, amount, network, status, transaction_hash")
        .eq("id", depositId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("DEPOSIT CHECK ERROR:", error);
        setMessage("Deposit request not found.");
        setChecking(false);
        return;
      }

      if (data.transaction_hash) {
        setTransactionHash(data.transaction_hash);
      }

      setChecking(false);
    }

    checkDeposit();
  }, [depositId, router]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
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
        setMessage(error.message);
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
        error?.message ||
          "An unexpected error occurred."
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

          <div className="bg-blue-900/30 border border-blue-600 rounded-xl p-4 mb-6">
            <p className="font-bold text-blue-300 mb-2">
              Submit Transaction ID / Hash
            </p>

            <p className="text-sm text-blue-100">
              After sending your USDT, paste the transaction
              ID or transaction hash below.
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
                placeholder="Paste your transaction ID or hash here"
                rows={6}
                required
                disabled={loading}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none resize-none break-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 p-4 rounded-lg font-bold text-lg disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : "Submit Transaction"}
            </button>

          </form>

          {message && (
            <div className="mt-5 bg-slate-700 rounded-lg p-4 text-center">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg"
          >
            Return to Home
          </button>

        </div>
      </div>
    </main>
  );
}
