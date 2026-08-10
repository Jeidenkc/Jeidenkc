"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MIN_WITHDRAWAL = 50;
const MAX_WITHDRAWAL = 10000;

const networks = {
  TRC20: "USDT TRC20 (TRON)",
  ERC20: "USDT ERC20 (Ethereum)",
  BEP20: "USDT BEP20 (BNB Smart Chain)",
  SPL: "USDT SPL (Solana)",
  Polygon: "USDT Polygon",
};

type NetworkKey = keyof typeof networks;

export default function WithdrawPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [network, setNetwork] =
    useState<NetworkKey>("TRC20");

  const [loadingBalance, setLoadingBalance] =
    useState<boolean>(true);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [message, setMessage] =
    useState<string>("");

  /*
   * Load the user's current balance.
   */
  useEffect(() => {
    let active = true;

    async function loadBalance() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error(
            "AUTH ERROR:",
            authError
          );

          if (active) {
            setMessage(authError.message);
            setLoadingBalance(false);
          }

          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();

        console.log("PROFILE:", data);
        console.log(
          "PROFILE ERROR:",
          error
        );

        if (error) {
          if (active) {
            setMessage(error.message);
            setLoadingBalance(false);
          }

          return;
        }

        if (active) {
          setBalance(
            Number(data?.balance || 0)
          );

          setLoadingBalance(false);
        }
      } catch (error: any) {
        console.error(
          "BALANCE LOAD ERROR:",
          error
        );

        if (active) {
          setMessage(
            error?.message ||
              "Unable to load your balance."
          );

          setLoadingBalance(false);
        }
      }
    }

    loadBalance();

    return () => {
      active = false;
    };
  }, [router]);

  /*
   * Amount entered by the user.
   */
  const numericAmount = Number(amount);

  /*
   * Remaining balance preview.
   */
  const remainingBalance =
    Number.isFinite(numericAmount) &&
    numericAmount > 0
      ? balance - numericAmount
      : balance;

  /*
   * Submit withdrawal.
   */
  async function handleWithdraw(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setMessage("");

    const withdrawalAmount =
      Number(amount);

    const address =
      walletAddress.trim();

    /*
     * Validate amount.
     */
    if (
      !Number.isFinite(
        withdrawalAmount
      ) ||
      withdrawalAmount <= 0
    ) {
      setMessage(
        "Please enter a valid withdrawal amount."
      );

      return;
    }

    /*
     * Minimum withdrawal.
     */
    if (
      withdrawalAmount <
      MIN_WITHDRAWAL
    ) {
      setMessage(
        "Minimum withdrawal amount is $50."
      );

      return;
    }

    /*
     * Maximum withdrawal.
     */
    if (
      withdrawalAmount >
      MAX_WITHDRAWAL
    ) {
      setMessage(
        "Maximum withdrawal amount is $10,000."
      );

      return;
    }

    /*
     * Check displayed balance.
     */
    if (
      withdrawalAmount >
      balance
    ) {
      setMessage(
        `Insufficient balance. Your available balance is $${balance.toFixed(
          2
        )}.`
      );

      return;
    }

    /*
     * Validate wallet address.
     */
    if (!address) {
      setMessage(
        "Please enter your USDT withdrawal address."
      );

      return;
    }

    if (address.length < 10) {
      setMessage(
        "Please enter a valid wallet address."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * Get logged-in user.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "AUTH ERROR:",
          authError
        );

        setMessage(authError.message);
        setLoading(false);

        return;
      }

      if (!user) {
        setMessage(
          "Your session has expired. Please log in again."
        );

        setLoading(false);

        router.push("/login");

        return;
      }

      /*
       * Get the latest balance from Supabase.
       * This prevents using an old balance displayed
       * on the page.
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        setMessage(
          profileError.message
        );

        setLoading(false);

        return;
      }

      const currentBalance =
        Number(profile?.balance || 0);

      /*
       * Update displayed balance with
       * the latest database balance.
       */
      setBalance(currentBalance);

      /*
       * Final balance check.
       */
      if (
        withdrawalAmount >
        currentBalance
      ) {
        setMessage(
          `Insufficient balance. Your current balance is $${currentBalance.toFixed(
            2
          )}.`
        );

        setLoading(false);

        return;
      }

      /*
       * Create withdrawal request.
       *
       * The status is Processing.
       */
      const {
        data: withdrawal,
        error: withdrawalError,
      } = await supabase
        .from("withdrawals")
        .insert([
          {
            user_id: user.id,
            amount: withdrawalAmount,
            wallet_address: address,
            network: network,
            status: "Processing",
          },
        ])
        .select()
        .single();

      console.log(
        "WITHDRAWAL CREATED:",
        withdrawal
      );

      console.log(
        "WITHDRAWAL ERROR:",
        withdrawalError
      );

      if (withdrawalError) {
        console.error(
          "WITHDRAWAL INSERT ERROR:",
          withdrawalError
        );

        setMessage(
          withdrawalError.message
        );

        setLoading(false);

        return;
      }

      /*
       * Calculate new balance.
       */
      const newBalance =
        currentBalance -
        withdrawalAmount;

      /*
       * Deduct the withdrawal from
       * the user's balance.
       */
      const {
        error: balanceError,
      } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
        })
        .eq("id", user.id);

      /*
       * If balance update fails, remove
       * the withdrawal that was just created.
       */
      if (balanceError) {
        console.error(
          "BALANCE UPDATE ERROR:",
          balanceError
        );

        await supabase
          .from("withdrawals")
          .delete()
          .eq("id", withdrawal.id)
          .eq("user_id", user.id);

        setMessage(
          "Withdrawal could not be processed. Your balance was not changed."
        );

        setLoading(false);

        return;
      }

      /*
       * Update local balance.
       */
      setBalance(newBalance);

      /*
       * Clear the form.
       */
      setAmount("");
      setWalletAddress("");

      /*
       * Go to the separate processing page.
       */
      router.push(
        "/withdrawal/processing"
      );

    } catch (error: any) {
      console.error(
        "WITHDRAWAL ERROR:",
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
              Withdraw USDT
            </h1>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Dashboard
            </button>

          </div>

          {/* Available balance */}

          <div className="bg-slate-900 border border-green-600 rounded-xl p-5 mb-6">

            <p className="text-sm text-slate-400">
              Available Balance
            </p>

            <p className="text-3xl font-bold text-green-400 mt-1">

              {loadingBalance
                ? "Loading..."
                : `$${balance.toFixed(2)}`}

            </p>

          </div>

          {/* Withdrawal form */}

          <form
            onSubmit={handleWithdraw}
            className="space-y-5"
          >

            {/* Network */}

            <div>

              <label className="block text-sm font-medium mb-2">
                USDT Network
              </label>

              <select
                value={network}
                onChange={(e) =>
                  setNetwork(
                    e.target.value as NetworkKey
                  )
                }
                disabled={
                  loading ||
                  loadingBalance
                }
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none"
              >

                <option value="TRC20">
                  {networks.TRC20}
                </option>

                <option value="ERC20">
                  {networks.ERC20}
                </option>

                <option value="BEP20">
                  {networks.BEP20}
                </option>

                <option value="SPL">
                  {networks.SPL}
                </option>

                <option value="Polygon">
                  {networks.Polygon}
                </option>

              </select>

            </div>

            {/* Wallet address */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Your USDT Withdrawal Address
              </label>

              <input
                type="text"
                value={walletAddress}
                onChange={(e) =>
                  setWalletAddress(
                    e.target.value
                  )
                }
                placeholder="Enter your USDT wallet address"
                required
                disabled={loading}
                autoComplete="off"
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none"
              />

              <p className="text-xs text-yellow-400 mt-2">
                Make sure your address belongs to
                the selected network.
              </p>

            </div>

            {/* Amount */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Withdrawal Amount (USD)
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="Enter amount"
                min={MIN_WITHDRAWAL}
                max={MAX_WITHDRAWAL}
                step="0.01"
                required
                disabled={
                  loading ||
                  loadingBalance
                }
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 outline-none"
              />

              <div className="flex justify-between text-xs text-slate-400 mt-2">

                <span>
                  Minimum: $50
                </span>

                <span>
                  Maximum: $10,000
                </span>

              </div>

            </div>

            {/* Balance calculation */}

            <div className="bg-slate-900 rounded-lg p-4">

              <div className="flex justify-between">

                <span className="text-slate-400">
                  Available Balance
                </span>

                <span className="font-semibold">
                  ${balance.toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between mt-2">

                <span className="text-slate-400">
                  Withdrawal
                </span>

                <span className="font-semibold text-red-400">

                  {Number.isFinite(
                    numericAmount
                  ) &&
                  numericAmount > 0
                    ? `-$${numericAmount.toFixed(
                        2
                      )}`
                    : "$0.00"}

                </span>

              </div>

              <div className="border-t border-slate-700 mt-3 pt-3 flex justify-between">

                <span className="font-semibold">
                  Remaining Balance
                </span>

                <span
                  className={`font-bold ${
                    remainingBalance < 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  $
                  {remainingBalance.toFixed(2)}
                </span>

              </div>

            </div>

            {/* Rules */}

            <div className="bg-slate-900 rounded-lg p-4">

              <p className="font-semibold mb-3">
                Withdrawal Rules
              </p>

              <ul className="text-sm text-slate-300 space-y-2">

                <li>
                  • Minimum withdrawal: $50
                </li>

                <li>
                  • Maximum withdrawal: $10,000
                </li>

                <li>
                  • Withdrawal cannot exceed your
                  available balance.
                </li>

                <li>
                  • Select the correct USDT network
                  for your receiving address.
                </li>

              </ul>

            </div>

            {/* Submit button */}

            <button
              type="submit"
              disabled={
                loading ||
                loadingBalance
              }
              className="w-full bg-green-500 hover:bg-green-600 p-4 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processing Withdrawal..."
                : "Submit Withdrawal"}
            </button>

          </form>

          {/* Error/message */}

          {message && (
            <div className="mt-5 bg-slate-700 border border-slate-600 rounded-lg p-4 text-center text-sm">
              {message}
            </div>
          )}

          {/* Withdrawal history */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/withdrawal-history"
              )
            }
            disabled={loading}
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg disabled:opacity-50"
          >
            View Withdrawal History
          </button>

        </div>

      </div>

    </main>
  );
}
