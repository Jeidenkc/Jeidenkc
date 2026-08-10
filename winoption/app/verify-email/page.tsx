"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      router.replace("/login");
    }
  }, [countdown, router]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 text-center shadow-xl">
        <div className="text-6xl mb-6">
          📧
        </div>

        <h1 className="text-3xl font-bold text-green-400 mb-4">
          Verify Your Email
        </h1>

        <p className="text-gray-300 leading-relaxed mb-4">
          Your account has been created successfully.
        </p>

        <p className="text-gray-300 leading-relaxed mb-6">
          We have sent a verification email to your email address.
          Please check your inbox and click the verification link.
        </p>

        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm">
            After verification, you can log in to your account.
          </p>
        </div>

        <p className="text-green-400 font-semibold">
          Redirecting to login in {countdown}...
        </p>

        <button
          onClick={() => router.replace("/login")}
          className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
        >
          Go to Login Now
        </button>
      </div>
    </main>
  );
}
