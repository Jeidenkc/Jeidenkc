import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type TradeRow = {
  id: string;
  user_id: string;
  amount: number;
  payout: number | null;
  duration: number | null;
  opened_at: string | null;
  closed_at: string | null;
  status: string;
  result: string | null;
};

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: trades, error: fetchError } = await supabase
      .from("trades")
      .select("id, user_id, amount, payout, duration, opened_at, closed_at, status, result")
      .eq("status", "Open")
      .is("closed_at", null);

    if (fetchError) {
      return NextResponse.json(
        { ok: false, error: fetchError.message },
        { status: 500 }
      );
    }

    const now = Date.now();
    const settled: Array<{ id: string; result: string }> = [];
    const skipped: Array<{ id: string; reason: string }> = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const trade of (trades ?? []) as TradeRow[]) {
      const openedAtMs = trade.opened_at
        ? new Date(trade.opened_at).getTime()
        : now;

      const durationMs = Number(trade.duration ?? 0) * 1000;
      const expired = now >= openedAtMs + durationMs;

      if (!expired) {
        skipped.push({ id: trade.id, reason: "Not expired yet" });
        continue;
      }

      const isWin = Math.random() < 0.5;
      const result = isWin ? "Win" : "Loss";
      const closedAt = new Date().toISOString();

      const { error: closeError } = await supabase
        .from("trades")
        .update({
          status: "Closed",
          result,
          closed_at: closedAt,
        })
        .eq("id", trade.id);

      if (closeError) {
        errors.push({ id: trade.id, error: closeError.message });
        continue;
      }

      if (isWin) {
        const payout = Number(trade.payout ?? trade.amount * 1.8);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", trade.user_id)
          .single();

        if (profileError || !profile) {
          errors.push({
            id: trade.id,
            error: profileError?.message ?? "Profile not found",
          });
          continue;
        }

        const currentBalance = Number(profile.balance ?? 0);

        const { error: balanceError } = await supabase
          .from("profiles")
          .update({
            balance: currentBalance + payout,
          })
          .eq("id", trade.user_id);

        if (balanceError) {
          errors.push({ id: trade.id, error: balanceError.message });
          continue;
        }
      }

      settled.push({ id: trade.id, result });
    }

    return NextResponse.json({
      ok: true,
      settledCount: settled.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      settled,
      skipped,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}	

