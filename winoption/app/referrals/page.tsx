"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadReferrals() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setMessage(userError.message);
        return;
      }

      if (!user) {
        setMessage("You are not logged in.");
        return;
      }

      const { data, error } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_id")
        .eq("referrer_id", user.id);

      console.log("CURRENT USER:", user.id);
      console.log("REFERRALS:", data);
      console.log("REFERRAL ERROR:", error);

      if (error) {
        setMessage(error.message);
        return;
      }

      setReferrals(data || []);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message || "Unable to load referrals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferrals();
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-400">
            Referrals
          </h1>

          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
          >
            Dashboard
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">

          <h2 className="text-xl font-bold mb-4">
            My Referrals
          </h2>

          {loading && (
            <p className="text-slate-300">
              Loading referrals...
            </p>
          )}

          {!loading && message && (
            <div className="bg-red-900/40 border border-red-500 text-red-300 p-4 rounded-lg">
              {message}
            </div>
          )}

          {!loading && !message && referrals.length === 0 && (
            <p className="text-slate-400">
              You have no referrals yet.
            </p>
          )}

          {!loading && !message && referrals.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-3">
                      Referral ID
                    </th>

                    <th className="p-3">
                      Referred User
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-slate-700"
                    >
                      <td className="p-3 break-all">
                        {referral.id}
                      </td>

                      <td className="p-3 break-all">
                        {referral.referred_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}
