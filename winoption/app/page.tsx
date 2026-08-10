import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold">
            WinOption
          </Link>

          <nav className="hidden gap-8 md:flex">
            <a href="#markets" className="text-slate-300 hover:text-white">
              Markets
            </a>
            <a href="#features" className="text-slate-300 hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white">
              How It Works
            </a>
            <a href="#referral" className="text-slate-300 hover:text-white">
              Referral
            </a>
          </nav>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-slate-800">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Simple. Powerful. Accessible.
            </p>

            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Take control of your
              <span className="text-blue-500"> trading journey.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              A simple platform for managing your trading account, funds,
              markets, and account activity from one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
              >
                Get Started
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-900"
              >
                Learn How It Works
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Account Overview</p>
                <h2 className="mt-1 text-2xl font-bold">Trading Dashboard</h2>
              </div>

              <div className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                Active
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Available Balance</p>
              <p className="mt-2 text-4xl font-bold">$10,000.00</p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-xs text-slate-500">Markets</p>
                  <p className="mt-1 text-xl font-semibold">24+</p>
                </div>

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-1 text-xl font-semibold text-green-400">
                    Ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETS */}
      <section id="markets" className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Markets
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Explore available markets
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Access a range of markets through one convenient platform.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Forex", "Explore currency markets."],
              ["Crypto", "Explore digital asset markets."],
              ["Indices", "Follow major market indices."],
              ["Commodities", "Explore commodity markets."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  {title.charAt(0)}
                </div>

                <h3 className="mt-5 text-xl font-semibold">{title}</h3>

                <p className="mt-3 leading-6 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Features
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Everything in one place
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7">
              <h3 className="text-xl font-bold">Account Management</h3>
              <p className="mt-4 leading-7 text-slate-400">
                Manage your account information and monitor your trading
                activity from your dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7">
              <h3 className="text-xl font-bold">Funds</h3>
              <p className="mt-4 leading-7 text-slate-400">
                Keep track of your available balance, deposits, withdrawals,
                and account activity.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7">
              <h3 className="text-xl font-bold">Trading Tools</h3>
              <p className="mt-4 leading-7 text-slate-400">
                Access market information and tools designed to help you make
                informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              How It Works
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Get started in four steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "01",
                "Create an account",
                "Register and provide the required account information.",
              ],
              [
                "02",
                "Verify your account",
                "Complete the required verification steps.",
              ],
              [
                "03",
                "Fund your account",
                "Add funds using the available funding options.",
              ],
              [
                "04",
                "Start trading",
                "Access the platform and explore available markets.",
              ],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <span className="text-3xl font-bold text-blue-500">
                  {number}
                </span>

                <h3 className="mt-5 text-xl font-semibold">{title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL */}
      <section id="referral" className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Referral Program
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Invite others and grow together
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-slate-400">
              Share your referral link with others and track your referral
              activity from your account dashboard.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
            >
              Join Now
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              FAQ
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            <details className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                How do I create an account?
              </summary>

              <p className="mt-4 leading-7 text-slate-400">
                Select Register and enter the information required to create
                your account.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                How do I access my account?
              </summary>

              <p className="mt-4 leading-7 text-slate-400">
                Select Login and enter your account credentials.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                How can I manage my funds?
              </summary>

              <p className="mt-4 leading-7 text-slate-400">
                After signing in, use your account dashboard to view your
                balance and access the available deposit and withdrawal
                options.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <summary className="cursor-pointer font-semibold">
                How does the referral program work?
              </summary>

              <p className="mt-4 leading-7 text-slate-400">
                A referring user can receive a reward when a referred user
                completes the applicable qualifying activity.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to get started?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
            Create your account and explore the WinOption platform.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-900"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            {/* BRAND */}
            <div>
              <Link href="/" className="text-2xl font-bold">
                WinOption
              </Link>

              <p className="mt-4 max-w-sm leading-7 text-slate-400">
                A simple platform for managing your trading account, funds,
                and trading activity.
              </p>
            </div>

            {/* PLATFORM */}
            <div>
              <h3 className="font-semibold">Platform</h3>

              <div className="mt-4 space-y-3 text-sm">
                <Link
                  href="/"
                  className="block text-slate-400 hover:text-white"
                >
                  Home
                </Link>

                <a
                  href="#markets"
                  className="block text-slate-400 hover:text-white"
                >
                  Markets
                </a>

                <a
                  href="#features"
                  className="block text-slate-400 hover:text-white"
                >
                  Features
                </a>

                <a
                  href="#how-it-works"
                  className="block text-slate-400 hover:text-white"
                >
                  How It Works
                </a>
              </div>
            </div>

            {/* ACCOUNT */}
            <div>
              <h3 className="font-semibold">Account</h3>

              <div className="mt-4 space-y-3 text-sm">
                <Link
                  href="/login"
                  className="block text-slate-400 hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="block text-slate-400 hover:text-white"
                >
                  Register
                </Link>

                <a
                  href="#faq"
                  className="block text-slate-400 hover:text-white"
                >
                  FAQ
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-500">
            © {new Date().getFullYear()} WinOption. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
