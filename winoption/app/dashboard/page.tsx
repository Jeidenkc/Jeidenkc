"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Trade = {
  id: string;
  user_id?: string;
  asset?: string | null;
  amount?: number | null;
  direction?: string | null;
  duration?: number | null;
  status?: string | null;
  profit?: number | null;
  created_at?: string | null;
};

type Deposit = {
  id: string;
  user_id?: string;
  amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type Withdrawal = {
  id: string;
  user_id?: string;
  amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type Profile = {
  balance?: number | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setRefreshing(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        router.replace("/login");
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single<Profile>();

      if (profileError) {
        console.error("Profile loading error:", profileError);
      }

      setBalance(Number(profile?.balance ?? 0));

      const {
        data: tradeData,
        error: tradeError,
      } = await supabase
        .from("trades")
        .select(
          "id,user_id,asset,amount,direction,duration,status,profit,created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (tradeError) {
        console.error("Trading history error:", tradeError);
        setTrades([]);
      } else {
        setTrades((tradeData as Trade[]) || []);
      }

      const {
        data: depositData,
        error: depositError,
      } = await supabase
        .from("deposits")
        .select("id,user_id,amount,status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (depositError) {
        console.error("Deposit history error:", depositError);
        setDeposits([]);
      } else {
        setDeposits((depositData as Deposit[]) || []);
      }

      const {
        data: withdrawalData,
        error: withdrawalError,
      } = await supabase
        .from("withdrawals")
        .select("id,user_id,amount,status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (withdrawalError) {
        console.error("Withdrawal history error:", withdrawalError);
        setWithdrawals([]);
      } else {
        setWithdrawals((withdrawalData as Withdrawal[]) || []);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("Logout error:", error);
        alert(error.message);
        setLoggingOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
      setLoggingOut(false);
    }
  }

  function formatMoney(value: number | null | undefined) {
    const amount = Number(value ?? 0);

    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString();
  }

  function getStatusStyle(status: string | null | undefined) {
    const value = String(status || "").toLowerCase();

    if (
      value === "approved" ||
      value === "completed" ||
      value === "won" ||
      value === "success" ||
      value === "successful"
    ) {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (
      value === "rejected" ||
      value === "failed" ||
      value === "lost" ||
      value === "cancelled" ||
      value === "canceled"
    ) {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  const faqs = [
    {
      question: "How do I deposit?",
      answer:
        "Open the Deposit section from your dashboard. Enter the amount you want to deposit, select an available payment method, and follow the instructions shown on the deposit page. After submitting your request, you can monitor it from Deposit History.",
    },
    {
      question: "What is the minimum deposit required for trading?",
      answer:
        "The minimum deposit required to start trading on WinOption is $10.",
    },
    {
      question: "How do I withdraw?",
      answer:
        "Open the Withdraw section from your dashboard. Enter the amount you want to withdraw, provide the required withdrawal information, and submit the request. You can monitor the status from Withdrawal History.",
    },
    {
      question: "Why is my deposit or withdrawal showing as pending?",
      answer:
        "Pending means the request has been submitted successfully but has not yet been processed. The status will change after the request has been reviewed and processed.",
    },
    {
      question: "How does the WinOption Signals Bot work?",
      answer:
        "The Signals Bot analyzes available market information using its configured strategies and indicators and generates trading signals. A signal may provide information such as the asset, trading direction, and recommended duration. Signals are designed to assist trading decisions and do not guarantee a winning trade.",
    },
    {
      question: "How much does the Signals Bot subscription cost?",
      answer:
        "The WinOption Signals Bot subscription costs $7.",
    },
    {
      question: "What is the minimum trading amount?",
      answer:
        "The minimum amount for a single trade is $1.",
    },
    {
      question: "What trade durations are available?",
      answer:
        "WinOption supports short-term trade durations including 5 seconds, 10 seconds, and 15 seconds, together with any other durations enabled on the trading platform.",
    },
    {
      question: "How do I use a trading signal?",
      answer:
        "When a signal is generated, review the asset, direction, and recommended duration before deciding whether to place a trade. Trading signals are tools to assist decision-making and should not be treated as guarantees of profit.",
    },
    {
      question: "Are trading signals guaranteed to win?",
      answer:
        "No. Trading signals cannot guarantee a winning trade. Market conditions can change rapidly, and every trade carries risk.",
    },
    {
      question: "What is the WinOption welcome referral bonus?",
      answer:
        "The WinOption referral bonus is $3. When you refer a new user and that user makes a qualifying deposit of at least $10, you can receive the $3 referral bonus according to the platform's referral rules.",
    },
    {
      question: "What deposit is required for the $3 referral bonus?",
      answer:
        "The referred user must make a qualifying deposit of at least $10 for the referral bonus to apply.",
    },
    {
      question: "Where can I see my trading history?",
      answer:
        "Your previous trades are displayed in the Trading History section of your dashboard.",
    },
    {
      question: "Where can I see my deposit history?",
      answer:
        "Your deposit requests are displayed in the Deposit History section below your trading history.",
    },
    {
      question: "Where can I see my withdrawal history?",
      answer:
        "Your withdrawal requests are displayed in the Withdrawal History section below Deposit History.",
    },
    {
      question: "How can I keep my account secure?",
      answer:
        "Use a strong password, keep your login credentials private, and never share your password with another person.",
    },
    {
      question: "How do I log out of WinOption?",
      answer:
        "Click the Logout button at the top of your dashboard. Your local session will be signed out and you will be redirected to the login page.",
    },
  ];

  function toggleFaq(index: number) {
    setOpenFaq((current) =>
      current === index ? null : index
    );
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f7fb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#ffffff",
            borderRadius: "14px",
            padding: "30px",
            textAlign: "center",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "22px",
            }}
          >
            WinOption
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#111827",
        padding: "18px 14px 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px",
            marginBottom: "16px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "25px",
                lineHeight: 1.2,
                fontWeight: 700,
              }}
            >
              WinOption
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Dashboard
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={loadDashboard}
              disabled={refreshing}
              style={{
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                padding: "9px 13px",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: refreshing
                  ? "not-allowed"
                  : "pointer",
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                padding: "9px 15px",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: loggingOut
                  ? "not-allowed"
                  : "pointer",
                opacity: loggingOut ? 0.7 : 1,
              }}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "22px",
            marginBottom: "16px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Available Balance
          </p>

          <div
            style={{
              marginTop: "7px",
              fontSize: "32px",
              fontWeight: 700,
              wordBreak: "break-word",
            }}
          >
            ${formatMoney(balance)}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(135px, 1fr))",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/deposit")}
            style={{
              ...actionButtonStyle,
              background: "#16a34a",
            }}
          >
            Deposit
          </button>

          <button
            type="button"
            onClick={() => router.push("/withdraw")}
            style={{
              ...actionButtonStyle,
              background: "#2563eb",
            }}
          >
            Withdraw
          </button>

          <button
            type="button"
            onClick={() => router.push("/trading")}
            style={{
              ...actionButtonStyle,
              background: "#7c3aed",
            }}
          >
            Trade
          </button>

          <button
            type="button"
            onClick={() => router.push("/signals-bot")}
            style={{
              ...actionButtonStyle,
              background: "#111827",
            }}
          >
            Signals Bot
          </button>
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                }}
              >
                Trading
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Trade from $1 with available durations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/trading")}
              style={{
                border: "none",
                background: "#7c3aed",
                color: "#ffffff",
                padding: "9px 15px",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Open Trading
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            <div style={infoCardStyle}>
              <span style={infoLabelStyle}>
                Minimum Trade
              </span>

              <strong style={infoValueStyle}>
                $1
              </strong>
            </div>

            <div style={infoCardStyle}>
              <span style={infoLabelStyle}>
                Minimum Deposit
              </span>

              <strong style={infoValueStyle}>
                $10
              </strong>
            </div>

            <div style={infoCardStyle}>
              <span style={infoLabelStyle}>
                Trade Duration
              </span>

              <strong style={infoValueStyle}>
                5 sec
              </strong>
            </div>

            <div style={infoCardStyle}>
              <span style={infoLabelStyle}>
                Trade Duration
              </span>

              <strong style={infoValueStyle}>
                10 sec
              </strong>
            </div>

            <div style={infoCardStyle}>
              <span style={infoLabelStyle}>
                Trade Duration
              </span>

              <strong style={infoValueStyle}>
                15 sec
              </strong>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
              }}
            >
              Trading History
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Your latest trading activity.
            </p>
          </div>

          {trades.length === 0 ? (
            <EmptyState text="No trades recorded yet." />
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Asset</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Direction</th>
                    <th style={thStyle}>Duration</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Profit</th>
                  </tr>
                </thead>

                <tbody>
                  {trades.map((trade) => {
                    const statusStyle = getStatusStyle(
                      trade.status
                    );

                    return (
                      <tr key={trade.id}>
                        <td style={tdStyle}>
                          {formatDate(trade.created_at)}
                        </td>

                        <td style={tdStyle}>
                          {trade.asset || "-"}
                        </td>

                        <td style={tdStyle}>
                          ${formatMoney(trade.amount)}
                        </td>

                        <td style={tdStyle}>
                          {trade.direction || "-"}
                        </td>

                        <td style={tdStyle}>
                          {trade.duration
                            ? `${trade.duration}s`
                            : "-"}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              ...statusBadgeStyle,
                              ...statusStyle,
                            }}
                          >
                            {trade.status || "Pending"}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          {trade.profit === null ||
                          trade.profit === undefined
                            ? "-"
                            : `$${formatMoney(trade.profit)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DEPOSIT HISTORY */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
              }}
            >
              Deposit History
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Track your deposit requests and their status.
            </p>
          </div>

          {deposits.length === 0 ? (
            <EmptyState text="No deposit requests recorded yet." />
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {deposits.map((deposit) => {
                    const statusStyle = getStatusStyle(
                      deposit.status
                    );

                    return (
                      <tr key={deposit.id}>
                        <td style={tdStyle}>
                          {formatDate(deposit.created_at)}
                        </td>

                        <td style={tdStyle}>
                          ${formatMoney(deposit.amount)}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              ...statusBadgeStyle,
                              ...statusStyle,
                            }}
                          >
                            {deposit.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* WITHDRAWAL HISTORY */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
              }}
            >
              Withdrawal History
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Track your withdrawal requests and their status.
            </p>
          </div>

          {withdrawals.length === 0 ? (
            <EmptyState text="No withdrawal requests recorded yet." />
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {withdrawals.map((withdrawal) => {
                    const statusStyle = getStatusStyle(
                      withdrawal.status
                    );

                    return (
                      <tr key={withdrawal.id}>
                        <td style={tdStyle}>
                          {formatDate(withdrawal.created_at)}
                        </td>

                        <td style={tdStyle}>
                          ${formatMoney(withdrawal.amount)}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              ...statusBadgeStyle,
                              ...statusStyle,
                            }}
                          >
                            {withdrawal.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* FAQ SECTION */}
        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "18px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "21px",
                fontWeight: 700,
              }}
            >
              WinOption Frequently Asked Questions
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Find answers to common questions about deposits,
              withdrawals, trading, Signals Bot, referral bonuses,
              and account security.
            </p>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
            }}
          >
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={index}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "#ffffff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                      padding: "17px 5px",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#111827",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {faq.question}
                    </span>

                    <span
                      style={{
                        minWidth: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: 400,
                        color: "#374151",
                      }}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0 5px 17px",
                        color: "#4b5563",
                        fontSize: "14px",
                        lineHeight: 1.7,
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            textAlign: "center",
            padding: "10px 0",
            color: "#9ca3af",
            fontSize: "12px",
          }}
        >
          <p style={{ margin: 0 }}>
            WinOption
          </p>

          <p style={{ margin: "5px 0 0" }}>
            Trade responsibly. Trading involves risk.
          </p>
        </footer>
      </div>
    </main>
  );
}

const actionButtonStyle: React.CSSProperties = {
  border: "none",
  color: "#ffffff",
  padding: "13px 12px",
  borderRadius: "9px",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  minHeight: "45px",
};

const infoCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "13px",
};

const infoLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#6b7280",
  fontSize: "12px",
  marginBottom: "5px",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
};

const tableWrapperStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "650px",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "12px",
  fontWeight: 700,
  color: "#374151",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 10px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: "13px",
  color: "#374151",
  verticalAlign: "middle",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "22px 15px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px",
      }}
    >
      {text}
    </div>
  );
}
