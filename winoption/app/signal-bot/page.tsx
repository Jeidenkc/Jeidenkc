"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PAYMENT_ADDRESS =
  "TSgf5znY1RggfCqPyFaTPbMgybhP6ZBEfB";

const PRICE = 7;
const CURRENCY = "USDT";
const NETWORK = "TRC-20";

type Payment = {
  id: string;
  user_id: string;
  amount: number | null;
  currency: string | null;
  network: string | null;
  payment_address: string | null;
  transaction_hash: string | null;
  status: string | null;
  created_at: string | null;
  approved_at: string | null;
};

type Subscription = {
  id: string;
  user_id: string;
  payment_id: string | null;
  status: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

export default function SignalBotPage() {
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSignalBot();
  }, []);

  async function loadSignalBot() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: paymentData, error: paymentError } =
        await supabase
          .from("signal_payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (paymentError) {
        console.error(
          "Signal payment loading error:",
          paymentError
        );
      }

      setPayment(paymentData);

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("signal_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Signal subscription loading error:",
          subscriptionError
        );
      }

      setSubscription(subscriptionData);
    } catch (error) {
      console.error("Signal Bot loading error:", error);

      setMessage(
        "Unable to load Signal Bot information."
      );
    } finally {
      setLoading(false);
    }
  }

  function getSubscriptionActive() {
    if (!subscription) {
      return false;
    }

    if (subscription.status !== "active") {
      return false;
    }

    if (!subscription.expires_at) {
      return false;
    }

    return new Date(subscription.expires_at) > new Date();
  }

  function getStatusText() {
    if (getSubscriptionActive()) {
      return "Active";
    }

    if (payment?.status === "pending") {
      return "Payment Pending";
    }

    if (payment?.status === "approved") {
      return "Payment Approved";
    }

    if (payment?.status === "rejected") {
      return "Payment Rejected";
    }

    if (
      subscription &&
      subscription.status === "active" &&
      subscription.expires_at &&
      new Date(subscription.expires_at) <= new Date()
    ) {
      return "Expired";
    }

    return "Not Subscribed";
  }

  function getStatusClass() {
    const status = getStatusText();

    if (status === "Active") {
      return "bg-green-500/20 text-green-400";
    }

    if (status === "Payment Pending") {
      return "bg-yellow-500/20 text-yellow-400";
    }

    if (status === "Payment Approved") {
      return "bg-blue-500/20 text-blue-400";
    }

    if (status === "Payment Rejected") {
      return "bg-red-500/20 text-red-400";
    }

    if (status === "Expired") {
      return "bg-orange-500/20 text-orange-400";
    }

    return "bg-slate-700 text-slate-300";
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(
        PAYMENT_ADDRESS
      );

      setMessage("Payment address copied.");
    } catch (error) {
      console.error("Copy error:", error);

      setMessage(
        "Copy failed. Please copy the address manually."
      );
    }
  }

  async function submitPayment() {
    const hash = transactionHash.trim();

    if (!hash) {
      setMessage(
        "Please enter your TRC-20 transaction hash."
      );
      return;
    }

    if (hash.length < 10) {
      setMessage(
        "The transaction hash appears to be invalid."
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      if (getSubscriptionActive()) {
        setMessage(
          "You already have an active Signal Bot subscription."
        );
        return;
      }

      if (payment?.status === "pending") {
        setMessage(
          "You already have a payment waiting for admin approval."
        );
        return;
      }

      const { data: duplicatePayment, error: duplicateError } =
        await supabase
          .from("signal_payments")
          .select("id,status")
          .eq("transaction_hash", hash)
          .maybeSingle();

      if (duplicateError) {
        console.error(
          "Duplicate payment check error:",
          duplicateError
        );
      }

      if (duplicatePayment) {
        setMessage(
          "This transaction hash has already been submitted."
        );
        return;
      }

      const { data: newPayment, error: insertError } =
        await supabase
          .from("signal_payments")
          .insert({
            user_id: user.id,
            amount: PRICE,
            currency: CURRENCY,
            network: NETWORK,
            payment_address: PAYMENT_ADDRESS,
            transaction_hash: hash,
            status: "pending",
          })
          .select("*")
          .single();

      if (insertError) {
        console.error(
          "Signal payment submission error:",
          insertError
        );

        setMessage(
          "Payment submission failed. Please try again."
        );

        return;
      }

      setPayment(newPayment);
      setTransactionHash("");

      setMessage(
        "Payment submitted successfully. Your payment is now waiting for admin approval."
      );
    } catch (error) {
      console.error(
        "Signal payment submission error:",
        error
      );

      setMessage(
        "Something went wrong while submitting your payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-slate-900 p-8 text-center">
            <p className="text-slate-400">
              Loading Signal Bot...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const active = getSubscriptionActive();

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </button>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-2xl">
              🤖
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Signal Bot
              </h1>

              <p className="text-sm text-slate-400">
                Trading signal subscription
              </p>
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="mb-5 rounded-2xl bg-slate-900 p-5 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                Subscription Status
              </p>

              <p className="mt-2 text-xl font-bold">
                {getStatusText()}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${getStatusClass()}`}
            >
              {getStatusText()}
            </span>
          </div>

          {active && subscription?.expires_at && (
            <div className="mt-4 rounded-xl bg-green-500/10 p-4">
              <p className="text-sm text-green-300">
                Your Signal Bot subscription is active until:
              </p>

              <p className="mt-1 font-bold text-green-400">
                {new Date(
                  subscription.expires_at
                ).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* ACTIVE SUBSCRIPTION */}
        {active ? (
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 shadow-lg">
            <div className="text-4xl">
              ✓
            </div>

            <h2 className="mt-3 text-2xl font-bold">
              Signal Bot Active
            </h2>

            <p className="mt-2 text-green-100">
              Your subscription is currently active.
            </p>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-white px-5 py-3 font-bold text-green-700"
            >
              Open Signal Bot
            </button>
          </div>
        ) : (
          <>
            {/* PRICE */}
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 p-6 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-100">
                30 Day Subscription
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                $7 USDT
              </h2>

              <p className="mt-2 text-orange-100">
                Payment through the TRC-20 network.
              </p>
            </div>

            {/* PAYMENT INSTRUCTIONS */}
            <div className="mb-5 rounded-2xl bg-slate-900 p-5 shadow-lg">
              <h2 className="text-xl font-bold">
                Make Payment
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Send exactly 7 USDT to the address below using
                the TRC-20 network.
              </p>

              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                  TRC-20 Payment Address
                </p>

                <p className="break-all font-mono text-sm text-green-400">
                  {PAYMENT_ADDRESS}
                </p>
              </div>

              <button
                type="button"
                onClick={copyAddress}
                className="mt-3 w-full rounded-xl bg-slate-700 px-4 py-3 font-semibold hover:bg-slate-600"
              >
                Copy Payment Address
              </button>
            </div>

            {/* PAYMENT FORM */}
            <div className="mb-5 rounded-2xl bg-slate-900 p-5 shadow-lg">
              <h2 className="text-xl font-bold">
                Submit Payment
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                After sending the USDT, enter the transaction
                hash below so an administrator can review it.
              </p>

              {payment?.status === "pending" ? (
                <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <p className="font-semibold text-yellow-400">
                    Payment Pending
                  </p>

                  <p className="mt-1 text-sm text-yellow-200/80">
                    Your payment has been submitted and is
                    waiting for administrator approval.
                  </p>

                  {payment.transaction_hash && (
                    <p className="mt-3 break-all font-mono text-xs text-slate-300">
                      {payment.transaction_hash}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <label className="mt-5 block text-sm font-medium text-slate-300">
                    TRC-20 Transaction Hash
                  </label>

                  <input
                    type="text"
                    value={transactionHash}
                    onChange={(event) =>
                      setTransactionHash(
                        event.target.value
                      )
                    }
                    placeholder="Paste transaction hash"
                    disabled={submitting}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
                  />

                  <button
                    type="button"
                    onClick={submitPayment}
                    disabled={
                      submitting ||
                      !transactionHash.trim()
                    }
                    className="mt-4 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting Payment..."
                      : "Submit Payment for Approval"}
                  </button>
                </>
              )}

              {message && (
                <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
                  {message}
                </div>
              )}
            </div>
          </>
        )}

        {/* HOW IT WORKS */}
        <div className="mb-6 rounded-2xl bg-slate-900 p-5 shadow-lg">
          <h2 className="text-xl font-bold">
            How It Works
          </h2>

          <div className="mt-5 space-y-4">

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 font-bold">
                1
              </div>

              <div>
                <p className="font-semibold">
                  Send $7 USDT
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Use the TRC-20 network and the payment
                  address shown above.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 font-bold">
                2
              </div>

              <div>
                <p className="font-semibold">
                  Submit your transaction hash
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Enter the transaction hash after completing
                  the payment.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 font-bold">
                3
              </div>

              <div>
                <p className="font-semibold">
                  Administrator review
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Your payment remains pending until it is
                  reviewed and approved.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 font-bold">
                4
              </div>

              <div>
                <p className="font-semibold">
                  Get 30-day access
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  After approval, your Signal Bot subscription
                  becomes active for 30 days.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* PAYMENT DETAILS */}
        {payment && (
          <div className="mb-6 rounded-2xl bg-slate-900 p-5 shadow-lg">
            <h2 className="text-lg font-bold">
              Latest Payment
            </h2>

            <div className="mt-4 space-y-3 text-sm">

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Amount
                </span>

                <span className="font-semibold">
                  {payment.amount ?? PRICE}{" "}
                  {payment.currency ?? CURRENCY}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Network
                </span>

                <span className="font-semibold">
                  {payment.network ?? NETWORK}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Status
                </span>

                <span className="font-semibold capitalize">
                  {payment.status ?? "pending"}
                </span>
              </div>

              {payment.created_at && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Submitted
                  </span>

                  <span className="text-right font-semibold">
                    {new Date(
                      payment.created_at
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {payment.approved_at && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Approved
                  </span>

                  <span className="text-right font-semibold">
                    {new Date(
                      payment.approved_at
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {payment.transaction_hash && (
                <div className="pt-2">
                  <p className="mb-2 text-slate-500">
                    Transaction Hash
                  </p>

                  <p className="break-all rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-300">
                    {payment.transaction_hash}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-8 w-full rounded-xl bg-slate-800 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-700"
        >
          Back to Dashboard
        </button>

      </div>
    </main>
  );
}
