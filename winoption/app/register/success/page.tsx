"use client";

import { useRouter } from "next/navigation";

export default function RegisterSuccessPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-lg text-center">

        <h1 className="text-3xl font-bold text-green-400 mb-6">
          Check Your Email
        </h1>

        <p className="text-slate-300 mb-6">
          We've sent a confirmation link to your email address. Please click that
          link to activate your account before logging in.
        </p>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg"
        >
          Go to Login
        </button>

      </div>
    </main>
  );
}
