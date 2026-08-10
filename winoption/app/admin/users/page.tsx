"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  balance: number | null;
  is_admin: boolean | null;
  created_at?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, balance, is_admin, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }

  async function updateBalance(userId: string, currentBalance: number) {
    const value = window.prompt(
      "Enter the new balance:",
      String(currentBalance)
    );

    if (value === null) return;

    const newBalance = Number(value);

    if (!Number.isFinite(newBalance) || newBalance < 0) {
      alert("Please enter a valid balance.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Balance updated successfully.");
    loadUsers();
  }

  async function toggleAdmin(user: UserProfile) {
    const newValue = !user.is_admin;

    const confirmed = window.confirm(
      newValue
        ? "Make this user an administrator?"
        : "Remove administrator access from this user?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: newValue })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      newValue
        ? "Administrator access granted."
        : "Administrator access removed."
    );

    loadUsers();
  }

  const filteredUsers = users.filter((user) =>
    user.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-blue-400">
              Manage Users
            </h1>

            <p className="text-slate-400 mt-2">
              View and manage registered platform users.
            </p>
          </div>

          <button
            onClick={loadUsers}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
          >
            Refresh Users
          </button>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
          <label className="block text-sm text-slate-400 mb-2">
            Search by User ID
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter user ID..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Message */}
        {message && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-6">
            {message}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Total Users
            </p>

            <h2 className="text-3xl font-bold text-blue-400 mt-2">
              {users.length}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Administrators
            </p>

            <h2 className="text-3xl font-bold text-purple-400 mt-2">
              {users.filter((user) => user.is_admin).length}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Users
            </p>

            <h2 className="text-3xl font-bold text-green-400 mt-2">
              {users.filter((user) => !user.is_admin).length}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              Showing
            </p>

            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              {filteredUsers.length}
            </h2>
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-slate-400">
            Loading users...
          </div>
        )}

        {/* Empty */}
        {!loading && filteredUsers.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <p className="text-slate-400">
              No users found.
            </p>
          </div>
        )}

        {/* Users */}
        {!loading && filteredUsers.length > 0 && (
          <div className="space-y-4">

            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
              >

                <div className="flex flex-col gap-5">

                  {/* User information */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">

                      <span className="text-lg font-bold">
                        User
                      </span>

                      {user.is_admin && (
                        <span className="bg-purple-600/20 text-purple-300 border border-purple-600/40 px-3 py-1 rounded-full text-xs font-semibold">
                          ADMIN
                        </span>
                      )}

                    </div>

                    <p className="text-xs text-slate-500 mb-1">
                      USER ID
                    </p>

                    <p className="text-sm text-slate-300 break-all">
                      {user.id}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="bg-slate-800 rounded-xl p-4">

                    <p className="text-sm text-slate-400">
                      Current Balance
                    </p>

                    <p className="text-2xl font-bold text-green-400 mt-1">
                      ${Number(user.balance || 0).toFixed(2)}
                    </p>

                  </div>

                  {/* Date */}
                  {user.created_at && (
                    <div>
                      <p className="text-xs text-slate-500">
                        REGISTERED
                      </p>

                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(user.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">

                    <button
                      onClick={() =>
                        updateBalance(
                          user.id,
                          Number(user.balance || 0)
                        )
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-semibold"
                    >
                      Edit Balance
                    </button>

                    <button
                      onClick={() => toggleAdmin(user)}
                      className={
                        user.is_admin
                          ? "flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-semibold"
                          : "flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-xl font-semibold"
                      }
                    >
                      {user.is_admin
                        ? "Remove Admin"
                        : "Make Admin"}
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <a
            href="/admin"
            className="inline-block bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-semibold"
          >
            ← Back to Admin Dashboard
          </a>
        </div>

      </div>
    </main>
  );
}
