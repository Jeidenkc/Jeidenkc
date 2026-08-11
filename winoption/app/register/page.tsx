"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    if (!fullName || !email || !password) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      /*
       * If a referral code was entered, find the user
       * who owns that referral code.
       */
      let referrerId: string | null = null;

      if (referralCode.trim()) {
        const { data: referrer, error: referrerError } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", referralCode.trim())
          .maybeSingle();

        if (referrerError) {
          console.error("REFERRER ERROR:", referrerError);
          setMessage(referrerError.message);
          setLoading(false);
          return;
        }

        if (!referrer) {
          setMessage("Invalid referral code.");
          setLoading(false);
          return;
        }

        referrerId = referrer.id;
      }

      /*
       * Create the new Supabase account.
       */
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      console.log("REGISTER DATA:", data);
      console.log("REGISTER ERROR:", error);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMessage("Registration failed. No user was created.");
        setLoading(false);
        return;
      }

      /*
       * Create the referral record only when
       * a valid referral code was supplied.
       */
      if (referrerId && referrerId !== data.user.id) {
        const { data: referralData, error: referralError } = await supabase
          .from("referrals")
          .insert([
            {
              referrer_id: referrerId,
              referred_id: data.user.id,
            },
          ])
          .select();

        console.log("REFERRAL DATA:", referralData);
        console.log("REFERRAL ERROR:", referralError);

        if (referralError) {
          console.error("REFERRAL INSERT ERROR:", referralError);
          setMessage(
            "Account created, but the referral could not be recorded: " +
              referralError.message
          );
          setLoading(false);
          return;
        }
      }

      /*
       * If Supabase did not return a session, email confirmation
       * is required before the user can log in. Send them to the
       * dedicated "check your email" page instead of showing an
       * inline message.
       */
      if (!data.session) {
        router.push("/register/success");
        return;
      }

      setMessage(
        referralCode.trim()
          ? "Registration successful. Referral recorded."
          : "Registration successful."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("REGISTRATION ERROR:", err);
      setMessage(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-bold text-green-400 text-center mb-6">
          Create Account
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full p-3 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-green-500"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Referral Code
            </label>

            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code (optional)"
              className="w-full p-3 rounded-lg bg-slate-700 outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />

            <p className="text-xs text-slate-400 mt-2">
              If someone referred you, enter their referral code here.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

        </form>

        {message && (
          <div className="mt-5 p-3 rounded-lg bg-slate-700 text-sm text-center">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 rounded-lg"
        >
          Already have an account? Login
        </button>

      </div>
    </main>
  );
}
