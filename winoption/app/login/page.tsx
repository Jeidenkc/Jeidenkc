"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("error");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setMessageType("error");
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) {
      setLoading(false);
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setMessageType("success");
    setMessage("Login successful!");

    setTimeout(() => {
      router.push("/dashboard");
    }, 700);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4 py-8">

      <div className="w-full max-w-md">

        <div className="bg-slate-800 rounded-2xl shadow-xl p-6">

          {/* Title */}

          <h1 className="text-3xl font-bold text-center text-green-400 mb-6">
            Login
          </h1>

          {/* Message */}

          {message && (
            <div
              className={`mb-5 rounded-lg border p-3 text-center text-sm ${
                messageType === "success"
                  ? "border-green-500 bg-green-900/30 text-green-300"
                  : "border-red-500 bg-red-900/30 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* Login Form */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
                disabled={loading}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 outline-none focus:border-green-500 disabled:opacity-50"
              />

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 outline-none focus:border-green-500 disabled:opacity-50"
              />

            </div>

            {/* Login Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          {/* Register */}

          <div className="text-center mt-6">

            <p className="text-slate-400 text-sm">
              Don't have an account?
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/register")
              }
              disabled={loading}
              className="mt-2 text-green-400 hover:text-green-300 font-semibold disabled:opacity-50"
            >
              Create Account
            </button>

          </div>

          {/* Dashboard */}

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            disabled={loading}
            className="w-full mt-5 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition disabled:opacity-50"
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    </main>
  );
}
