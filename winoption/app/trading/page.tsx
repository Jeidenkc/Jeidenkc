"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingPage() {
  const router = useRouter();

  const [asset, setAsset] = useState("BTCUSD");
  const [direction, setDirection] = useState("BUY");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWidget = () => {
      if (!window.TradingView) return;

      const container = document.getElementById("tradingview_chart");
      if (!container) return;

      container.innerHTML = "";

      new window.TradingView.widget({
        autosize: true,
        symbol: asset,
        interval: "1",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0f172a",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        container_id: "tradingview_chart",
      });
    };

    if (!document.getElementById("tv-script")) {
      const script = document.createElement("script");

      script.id = "tv-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = loadWidget;

      document.body.appendChild(script);
    } else {
      loadWidget();
    }
  }, [asset]);

  async function handleTrade(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid trade amount.");
      return;
    }

    if (!duration || Number(duration) <= 0) {
      alert("Select a valid trade duration.");
      return;
    }

    setLoading(true);

    const payout = Number(amount) * 1.8;

    const { error } = await supabase.rpc("place_trade", {
      p_asset: asset,
      p_direction: direction,
      p_amount: Number(amount),
      p_duration: Number(duration),
      p_payout: payout,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Trade opened successfully!");

    setAmount("");

    router.push("/trade-history");
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-center mb-6">
          Live Trading
        </h1>

        {/* TradingView Chart */}
        <div
          id="tradingview_chart"
          className="w-full h-[500px] rounded-xl overflow-hidden mb-6"
        />

        {/* Trading Form */}
        <div className="max-w-xl mx-auto bg-slate-800 rounded-xl p-5">

          <form onSubmit={handleTrade} className="space-y-5">

            {/* Asset */}
            <div>
              <label className="block mb-2 font-medium">
                Asset
              </label>

              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full p-3 rounded bg-slate-700 text-white"
              >
                <option value="BTCUSD">BTC/USD</option>
                <option value="ETHUSD">ETH/USD</option>
                <option value="EURUSD">EUR/USD</option>
                <option value="GBPUSD">GBP/USD</option>
                <option value="XAUUSD">Gold</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="block mb-2 font-medium">
                Direction
              </label>

              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full p-3 rounded bg-slate-700 text-white"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            {/* Trade Amount */}
            <div>
              <label className="block mb-2 font-medium">
                Trade Amount
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 rounded bg-slate-700 text-white"
                placeholder="100"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block mb-2 font-medium">
                Trade Duration
              </label>

              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 rounded bg-slate-700 text-white"
              >
                <option value="5">5 Seconds</option>
                <option value="10">10 Seconds</option>
                <option value="15">15 Seconds</option>
                <option value="30">30 Seconds</option>
                <option value="60">1 Minute</option>
                <option value="300">5 Minutes</option>
                <option value="900">15 Minutes</option>
                <option value="1800">30 Minutes</option>
                <option value="3600">1 Hour</option>
              </select>
            </div>

            {/* Potential Payout */}
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-lg">
                Potential Payout:

                <span className="ml-2 font-bold text-green-400">
                  $
                  {amount
                    ? (Number(amount) * 1.8).toFixed(2)
                    : "0.00"}
                </span>
              </p>
            </div>

            {/* Open Trade Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-600 py-3 rounded-lg font-bold text-lg"
            >
              {loading ? "Opening Trade..." : "Open Trade"}
            </button>

          </form>
        </div>

        {/* Selected Duration Display */}
        <div className="max-w-xl mx-auto mt-5 text-center text-slate-300">
          Selected duration:{" "}
          <span className="font-bold text-white">
            {duration === "5"
              ? "5 Seconds"
              : duration === "10"
              ? "10 Seconds"
              : duration === "15"
              ? "15 Seconds"
              : duration === "30"
              ? "30 Seconds"
              : duration === "60"
              ? "1 Minute"
              : duration === "300"
              ? "5 Minutes"
              : duration === "900"
              ? "15 Minutes"
              : duration === "1800"
              ? "30 Minutes"
              : duration === "3600"
              ? "1 Hour"
              : `${duration} Seconds`}
          </span>
        </div>

      </div>
    </main>
  );
}
