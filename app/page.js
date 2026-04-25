"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EXAMPLES = [
  "Analyze the symbolism in The Great Gatsby and its role in the American Dream theme.",
  "Solve and explain: A train travels 300km at 60km/h. How long does it take, and what if it stops for 45 minutes?",
  "Compare the causes of World War I and World War II in a 1000-word essay.",
];

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [openSteps, setOpenSteps] = useState({});
  const [doneSteps, setDoneSteps] = useState({});
  const [checklist, setChecklist] = useState({});

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error("Authentication required.");
        const json = await res.json();
        setUser(json);
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setData(null);
    setError("");
    setSaveStatus("");
    setOpenSteps({});
    setDoneSteps({});
    setChecklist({});

    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setData(json);
      const refreshed = await fetch("/api/user");
      if (refreshed.ok) {
        setUser(await refreshed.json());
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleUpgrade() {
    setSaveStatus("");
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setSaveStatus(json.error || "Unable to start checkout.");
      return;
    }
    if (json.url) {
      window.location.href = json.url;
    }
  }

  async function handleSaveAssignment() {
    if (!data || !user?.premium) return;
    setSaveStatus("");

    const title = data.task_breakdown?.[0]?.title || prompt.slice(0, 60);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, prompt, result: data }),
    });
    const json = await res.json();
    if (!res.ok) {
      setSaveStatus(json.error || "Unable to save assignment.");
      return;
    }
    setUser(json);
    setSaveStatus("Assignment saved to your premium account.");
  }

  function toggleStep(i) {
    setOpenSteps((prev) => ({ ...prev, [i]: !prev[i] }));
  }
  function toggleDone(i, e) {
    e.stopPropagation();
    setDoneSteps((prev) => ({ ...prev, [i]: !prev[i] }));
  }
  function toggleCheck(i) {
    setChecklist((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  const checkCount = data ? Object.values(checklist).filter(Boolean).length : 0;
  const checkTotal = data?.checklist?.length || 0;
  const progress = checkTotal ? Math.round((checkCount / checkTotal) * 100) : 0;
  const canSubmit = !!prompt.trim() && !loading && (user?.premium || user?.uploadsRemaining > 0);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading account…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-1">Study companion</h1>
              <p className="text-sm text-neutral-500">
                Paste your assignment. Get a step-by-step breakdown with guided hints — not answers.
              </p>
            </div>
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">
              <div className="font-medium">{user?.email}</div>
              <div className="mt-1 text-xs text-neutral-500">
                {user?.premium ? "Premium member" : "Free account"} • {user?.uploadsRemaining} uploads remaining
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  Log out
                </button>
                {!user?.premium && (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Upgrade to Premium
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            <div className="font-medium mb-1">Premium features</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Saved assignment tracking</li>
              <li>Unlimited uploads</li>
              <li>Priority study history</li>
            </ul>
            {!user?.premium && (
              <p className="mt-3 text-xs text-blue-800 dark:text-blue-200">Upgrade now to unlock saved study history and premium upload access.</p>
            )}
          </div>
        </div>

        <textarea
          className="w-full min-h-[110px] text-[15px] p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 resize-y focus:outline-none focus:border-neutral-400 mb-3"
          placeholder="e.g. Write an essay analyzing the causes and effects of the French Revolution…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs text-neutral-400">Try:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="text-xs px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
            >
              {ex.slice(0, 30)}…
            </button>
          ))}
        </div>

        <button
          onClick={run}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[15px] font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? "Breaking it down…" : "Break it down ↗"}
        </button>

        {!user?.premium && user?.uploadsRemaining <= 0 && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            Your free upload limit is exhausted. Upgrade to premium for unlimited access.
          </div>
        )}

        {saveStatus && (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            {saveStatus}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 mt-6 text-sm text-neutral-400">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Analyzing your assignment…
          </div>
        )}

        {error && (
          <div className="mt-6 p-3 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm border border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        {data?.guarded && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 text-sm text-red-800 dark:text-red-200">
            <div className="font-medium mb-1">Let's do this together, not for you</div>
            {data.guard_message}
          </div>
        )}

        {data && !data.guarded && (
          <>
            <div className="mt-8 flex flex-col gap-6">
            <div>
              <div className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-3">
                Step-by-step breakdown
              </div>
              <div className="flex flex-col gap-2">
                {data.task_breakdown.map((step, i) => (
                  <div
                    key={i}
                    onClick={() => toggleStep(i)}
                    className={`border rounded-xl p-4 cursor-pointer transition ${
                      doneSteps[i]
                        ? "border-green-200 dark:border-green-800"
                        : openSteps[i]
                        ? "border-neutral-400 dark:border-neutral-500"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`min-w-[24px] h-6 rounded-full flex items-center justify-center text-xs font-medium border mt-0.5 ${
                          doneSteps[i]
                            ? "bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300"
                            : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                        }`}
                      >
                        {doneSteps[i] ? "✓" : i + 1}
                      </div>
                      <div className="flex-1 text-[15px] font-medium">{step.title}</div>
                      <div className="text-xs text-neutral-400 pt-0.5">{openSteps[i] ? "▾" : "▸"}</div>
                    </div>

                    {openSteps[i] && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 pl-9 flex flex-col gap-3">
                        <div>
                          <span className="text-[11px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5">
                            Why this matters
                          </span>
                          <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{step.why}</p>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {step.explanation}
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                            Hint
                          </div>
                          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{step.hint}</p>
                        </div>
                        <button
                          onClick={(e) => toggleDone(i, e)}
                          className={`text-xs px-3 py-1.5 rounded-full border w-fit transition ${
                            doneSteps[i]
                              ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                              : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                          }`}
                        >
                          {doneSteps[i] ? "Completed" : "Mark complete"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-3">
                Study checklist
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                {data.checklist.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`flex items-center gap-2 py-1.5 cursor-pointer text-sm select-none ${
                      checklist[i] ? "line-through text-neutral-400" : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 min-w-[16px] rounded border flex items-center justify-center transition ${
                        checklist[i]
                          ? "bg-green-100 border-green-400 dark:bg-green-900 dark:border-green-600"
                          : "border-neutral-300 dark:border-neutral-600"
                      }`}
                    >
                      {checklist[i] && (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <polyline
                            points="1.5,5 4,7.5 8.5,2.5"
                            stroke="#3B6D11"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {checkCount} of {checkTotal} done
              </div>
            </div>
          </div>

          {user?.premium && (
            <>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Save assignment
                </button>
                <span className="text-sm text-neutral-500">Saved assignments are stored on your premium account.</span>
              </div>

              <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">Saved assignments</div>
                {user.savedAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {user.savedAssignments.map((assignment) => (
                      <div key={assignment.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{assignment.title}</div>
                        <div className="mt-1 text-xs text-neutral-500">{new Date(assignment.savedAt).toLocaleString()}</div>
                        <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 overflow-hidden">{assignment.prompt}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">You have no saved assignments yet. Use the Save assignment button after a breakdown.</p>
                )}
              </div>
            </>
          )}
          </>
        )}
      </div>
    </main>
  );
}