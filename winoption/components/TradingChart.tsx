"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
} from "lightweight-charts";
import { supabase } from "@/lib/supabase";

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 500,

      layout: {
        background: { color: "#0f172a" },
        textColor: "#ffffff",
      },

      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },

      rightPriceScale: {
        borderColor: "#334155",
      },

      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    /*
     * Temporary market data.
     * We will connect this to real market data later.
     */
    candleSeries.setData([
      {
        time: "2026-08-01",
        open: 101,
        high: 105,
        low: 99,
        close: 104,
      },
      {
        time: "2026-08-02",
        open: 104,
        high: 108,
        low: 103,
        close: 107,
      },
      {
        time: "2026-08-03",
        open: 107,
        high: 109,
        low: 105,
        close: 106,
      },
      {
        time: "2026-08-04",
        open: 106,
        high: 111,
        low: 104,
        close: 110,
      },
      {
        time: "2026-08-05",
        open: 110,
        high: 113,
        low: 108,
        close: 112,
      },
    ]);

    /*
     * Load the user's trades.
     */
    async function loadTradeMarkers() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: trades, error } = await supabase
        .from("trades")
        .select(
          "id, direction, amount, status, result, opened_at, closed_at"
        )
        .eq("user_id", user.id)
        .order("opened_at", { ascending: true });

      if (error) {
        console.error("Error loading trade markers:", error);
        return;
      }

      if (!trades || trades.length === 0) {
        return;
      }

      /*
       * Markers are displayed against the nearest chart candle.
       *
       * BUY  = green
       * SELL = red
       * WIN  = green
       * LOSS = red
       * PENDING = yellow
       */
      const markers = trades
        .map((trade) => {
          const openedDate = new Date(trade.opened_at);

          const day = openedDate.toISOString().slice(0, 10);

          let markerColor = "#eab308";
          let markerText = "PENDING";

          if (trade.result === "Win") {
            markerColor = "#22c55e";
            markerText = "WIN";
          } else if (trade.result === "Loss") {
            markerColor = "#ef4444";
            markerText = "LOSS";
          } else if (trade.direction === "BUY") {
            markerColor = "#22c55e";
            markerText = "BUY";
          } else if (trade.direction === "SELL") {
            markerColor = "#ef4444";
            markerText = "SELL";
          }

          return {
            time: day,
            position:
              trade.direction === "SELL" ? "aboveBar" : "belowBar",
            color: markerColor,
            shape:
              trade.result === "Win"
                ? "arrowUp"
                : trade.result === "Loss"
                ? "arrowDown"
                : trade.direction === "SELL"
                ? "arrowDown"
                : "arrowUp",
            text: markerText,
          };
        })
        .filter((marker) => {
          return [
            "2026-08-01",
            "2026-08-02",
            "2026-08-03",
            "2026-08-04",
            "2026-08-05",
          ].includes(marker.time as string);
        });

      if (markers.length > 0) {
        createSeriesMarkers(candleSeries, markers as any);
      }
    }

    loadTradeMarkers();

    const resize = () => {
      if (!chartContainerRef.current) return;

      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-[500px] rounded-xl overflow-hidden"
    />
  );
}
