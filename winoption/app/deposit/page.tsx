"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const networks = {
  TRC20: {
    name: "USDT TRC20 (TRON)",
    address: "TSgf5znY1RggfCqPyFaTPbMgybhP6ZBEfB",
  },

  ERC20: {
    name: "USDT ERC20 (Ethereum)",
    address: "0xf81751a89f7d5136d22b6bc90f70afa13b1aac6a",
  },

  BEP20: {
    name: "USDT BEP20 (BNB Smart Chain)",
    address: "0xf81751a89f7d5136d22b6bc90f70afa13b1aac6a",
  },

  SPL: {
    name: "USDT SPL (Solana)",
    address: "6JYtPLZ6hTcMbZimSDNzAiGz9uL12SreiRB41hQCEzrq",
  },

  Polygon: {
    name: "USDT Polygon",
    address: "0xf81751a89f7d5136d22b6bc90f70afa13b1aac6a",
  },
};

type NetworkKey = keyof typeof networks;

export default function DepositPage() {
  const router = useRouter();

  const [network, setNetwork] = useState<NetworkKey>("TRC20");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedNetwork = networks[network];

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(selectedNetwork.address);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);

      setMessage(
        "Unable to copy the address. Please copy it manually."
      );
    }
  }

  async function handleDeposit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");

    const numericAmount = Number(amount);

    /*
     * Deposit limits:
     * Minimum = $10
     * Maximum = $100,000
     */
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 10 ||
      numericAmount > 100000
    ) {
      setMessage(
        "Deposit amount must be between $10 and $100,000."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * Check the logged-in user.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("USER:", user);
      console.log("AUTH ERROR:", authError);

      if (authError) {
        console.error("AUTH ERROR:", authError);

        setMessage(authError.message);
        setLoading(false);

        return;
      }

      if (!user) {
        setMessage("You are not logged in.");

        setLoading(false);

        router.push("/login");

        return;
      }

      /*
       * Create the deposit request.
       *
       * The deposit remains Pending.
       *
       * Admin must approve it later.
       */
      const {
        data,
        error,
      } = await supabase
        .from("deposits")
        .insert([
          {
            user_id: user.id,
            amount: numericAmount,
            network: network,
            status: "Pending",
          },
        ])
        .select();

      console.log("DEPOSIT DATA:", data);
      console.log("DEPOSIT ERROR:", error);

      if (error) {
        console.error(
          "DEPOSIT INSERT ERROR:",
          error
        );

        setMessage(error.message);

        setLoading(false);

        return;
      }

      /*
       * Make sure Supabase returned the new deposit.
       */
      if (!data || data.length === 0) {
        setMessage(
          "Deposit was not created. Please try again."
        );

        setLoading(false);

        return;
      }

      /*
       * Send the user to the transaction
       * hash submission page.
       */
      router.push(
        `/deposit/transaction?id=${data[0].id}`
      );

    } catch (error: any) {
      console.error(
        "DEPOSIT ERROR:",
        error
      );

      setMessage(
        error?.message ||
          "An unexpected error occurred."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8">

      <div className="max-w-lg mx-auto">

        <div className="bg-slate-800 rounded-2xl shadow-xl p-6">

          {/* Header */}

          <div className="flex items-center justify-between mb-6">

            <h1 className="text-3xl font-bold text-green-400">
              Deposit USDT
            </h1>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
            >
              Dashboard
            </button>

          </div>

          {/* Warning */}

          <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-4 mb-6">

            <p className="font-bold text-yellow-300 mb-1">
              Important
            </p>

            <p className="text-sm text-yellow-100">
              Send USDT only through the network
              selected below. Sending USDT through
              the wrong network may result in loss
              of funds.
            </p>

          </div>

          <form
            onSubmit={handleDeposit}
            className="space-y-5"
          >

            {/* Network */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Select USDT Network
              </label>

              <select
                value={network}
                onChange={(e) =>
                  setNetwork(
                    e.target.value as NetworkKey
                  )
                }
                disabled={loading}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none"
              >

                <option value="TRC20">
                  USDT — TRC20 (TRON)
                </option>

                <option value="ERC20">
                  USDT — ERC20 (Ethereum)
                </option>

                <option value="BEP20">
                  USDT — BEP20 (BNB Smart Chain)
                </option>

                <option value="SPL">
                  USDT — SPL (Solana)
                </option>

                <option value="Polygon">
                  USDT — Polygon
                </option>

              </select>

            </div>

            {/* Address */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Payment Address
              </label>

              <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">

                <p className="text-green-400 font-semibold mb-2">
                  {selectedNetwork.name}
                </p>

                <p className="text-sm break-all text-slate-200 leading-6">
                  {selectedNetwork.address}
                </p>

                <button
                  type="button"
                  onClick={copyAddress}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {copied
                    ? "Address Copied"
                    : "Copy Address"}
                </button>

              </div>

            </div>

            {/* Amount */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Deposit Amount (USD)
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="Enter amount"
                min="10"
                max="100000"
                step="0.01"
                required
                disabled={loading}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none"
              />

              <p className="text-xs text-slate-400 mt-2">
                Minimum deposit: $10
              </p>

              <p className="text-xs text-slate-400">
                Maximum deposit: $100,000
              </p>

            </div>

            {/* Instructions */}

            <div className="bg-slate-900 rounded-lg p-4">

              <p className="font-semibold text-white mb-2">
                Deposit Instructions
              </p>

              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">

                <li>
                  Select the network you will use.
                </li>

                <li>
                  Copy the corresponding USDT
                  payment address.
                </li>

                <li>
                  Send your USDT to that address.
                </li>

                <li>
                  Enter the amount you are sending.
                </li>

                <li>
                  Click Submit Deposit.
                </li>

                <li>
                  On the next page, enter your
                  transaction ID or hash.
                </li>

              </ol>

            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 p-4 rounded-lg font-bold text-lg disabled:opacity-50"
            >
              {loading
                ? "Creating Deposit..."
                : "Submit Deposit"}
            </button>

          </form>

          {/* Message */}

          {message && (
            <div className="mt-5 bg-slate-700 rounded-lg p-4 text-center">
              {message}
            </div>
          )}

          {/* History */}

          <button
            type="button"
            onClick={() =>
              router.push("/deposit-history")
            }
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg"
          >
            View Deposit History
          </button>

        </div>

      </div>

    </main>
  );
}
