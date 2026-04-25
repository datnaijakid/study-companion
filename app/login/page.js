"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await readJsonSafely(response);
      if (!response.ok) {
        throw new Error(json.error || "Unable to sign in.");
      }

      window.location.href = "/";
    } catch (requestError) {
      setError(requestError.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-2 text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Log in to access your study workspace and saved premium activity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              required
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-blue-600 hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </main>
  );
}
