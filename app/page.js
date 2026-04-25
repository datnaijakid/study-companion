"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "Analyze the symbolism in The Great Gatsby and its role in the American Dream theme.",
  "Solve and explain: A train travels 300km at 60km/h. How long does it take, and what if it stops for 45 minutes?",
  "Compare the causes of World War I and World War II in a 1000-word essay.",
];

function truncateText(value, maxLength = 72) {
  if (!value) return "Untitled assignment";
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
}

function deriveAssignmentTitle(prompt) {
  const firstLine = prompt
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return truncateText(firstLine || prompt, 72);
}

function normalizeSavedResult(savedResult) {
  if (savedResult?.breakdown && savedResult?.progress) {
    return savedResult;
  }

  return {
    breakdown: savedResult,
    progress: {
      doneSteps: {},
      checklist: {},
      openSteps: {},
    },
  };
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

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
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) throw new Error("Authentication required.");
        const json = await readJsonSafely(response);
        setUser(json);
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, [router]);

  function resetWorkspace() {
    setOpenSteps({});
    setDoneSteps({});
    setChecklist({});
  }

  async function run() {
    if (!prompt.trim()) return;

    setLoading(true);
    setData(null);
    setError("");
    setSaveStatus("");
    resetWorkspace();

    try {
      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await readJsonSafely(response);
      if (!response.ok) throw new Error(json.error || "Something went wrong.");

      setData(json);

      const refreshed = await fetch("/api/user");
      if (refreshed.ok) {
        setUser(await readJsonSafely(refreshed));
      }
    } catch (requestError) {
      setError(requestError.message || "Something went wrong.");
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

    const response = await fetch("/api/billing/checkout", { method: "POST" });
    const json = await readJsonSafely(response);

    if (!response.ok) {
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

    const title = deriveAssignmentTitle(prompt);
    const result = {
      breakdown: data,
      progress: {
        doneSteps,
        checklist,
        openSteps,
      },
    };

    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, prompt, result }),
    });
    const json = await readJsonSafely(response);

    if (!response.ok) {
      setSaveStatus(json.error || "Unable to save assignment.");
      return;
    }

    setUser(json);
    setSaveStatus("Assignment saved to your premium account.");
  }

  async function handleDeleteAssignment(assignmentId) {
    setSaveStatus("");
    setDeletingId(assignmentId);

    try {
      const response = await fetch("/api/assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const json = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(json.error || "Unable to delete assignment.");
      }

      setUser(json);
      setSaveStatus("Saved assignment deleted.");
    } catch (requestError) {
      setSaveStatus(requestError.message || "Unable to delete assignment.");
    } finally {
      setDeletingId("");
    }
  }

  function handleLoadAssignment(assignment) {
    const normalized = normalizeSavedResult(assignment.result);

    setPrompt(assignment.prompt);
    setData(normalized.breakdown);
    setDoneSteps(normalized.progress?.doneSteps || {});
    setChecklist(normalized.progress?.checklist || {});
    setOpenSteps(normalized.progress?.openSteps || {});
    setError("");
    setSaveStatus(`Loaded "${assignment.title}" into your workspace.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearCurrentBreakdown() {
    setData(null);
    setPrompt("");
    setError("");
    setSaveStatus("");
    resetWorkspace();
  }

  function toggleStep(index) {
    setOpenSteps((current) => ({ ...current, [index]: !current[index] }));
  }

  function toggleDone(index, event) {
    event.stopPropagation();
    setDoneSteps((current) => ({ ...current, [index]: !current[index] }));
  }

  function toggleCheck(index) {
    setChecklist((current) => ({ ...current, [index]: !current[index] }));
  }

  const checkCount = data ? Object.values(checklist).filter(Boolean).length : 0;
  const checkTotal = data?.checklist?.length || 0;
  const progress = checkTotal ? Math.round((checkCount / checkTotal) * 100) : 0;
  const canSubmit = Boolean(prompt.trim()) && !loading && (user?.premium || user?.uploadsRemaining > 0);
  const savedAssignments = user?.savedAssignments || [];

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading account...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-1">Study Companion</h1>
              <p className="text-sm text-neutral-500">
                Paste your assignment and get a step-by-step breakdown with guided hints, not finished answers.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              <div className="font-medium">{user?.email}</div>
              <div className="mt-1 text-xs text-neutral-500">
                {user?.premium ? "Premium member" : "Free account"} • {user?.uploadsRemaining} uploads remaining
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
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
              <p className="mt-3 text-xs text-blue-800 dark:text-blue-200">
                Upgrade to unlock saved study history and premium upload access.
              </p>
            )}
          </div>
        </div>

        <textarea
          className="w-full min-h-[110px] resize-y rounded-xl border border-neutral-200 bg-white p-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          placeholder="e.g. Write an essay analyzing the causes and effects of the French Revolution..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />

        <div className="mt-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400">Try:</span>
          {EXAMPLES.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              {example.slice(0, 30)}...
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={run}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-5 py-2.5 text-[15px] font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {loading ? "Breaking it down..." : "Break it down ->"}
          </button>

          {(prompt || data) && (
            <button
              type="button"
              onClick={clearCurrentBreakdown}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Clear workspace
            </button>
          )}
        </div>

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
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
            <span className="flex gap-1">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce"
                  style={{ animationDelay: `${index * 0.15}s` }}
                />
              ))}
            </span>
            Analyzing your assignment...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {user?.premium && (
          <div className="mt-8 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Saved assignments</div>
                <div className="text-xs text-neutral-500">Load a previous breakdown or remove it from your library.</div>
              </div>
              <div className="text-xs text-neutral-500">{savedAssignments.length} saved</div>
            </div>

            {savedAssignments.length > 0 ? (
              <div className="space-y-3">
                {savedAssignments.map((assignment) => (
                  (() => {
                    const normalized = normalizeSavedResult(assignment.result);
                    const savedChecklist = normalized.progress?.checklist || {};
                    const savedCheckCount = Object.values(savedChecklist).filter(Boolean).length;
                    const savedCheckTotal = normalized.breakdown?.checklist?.length || 0;

                    return (
                      <div
                        key={assignment.id}
                        className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">{assignment.title}</div>
                            <div className="mt-1 text-xs text-neutral-500">{new Date(assignment.savedAt).toLocaleString()}</div>
                            <div className="mt-2 line-clamp-3 overflow-hidden text-sm text-neutral-600 dark:text-neutral-400">
                              {assignment.prompt}
                            </div>
                            {savedCheckTotal > 0 && (
                              <div className="mt-3 text-xs text-neutral-500">
                                Progress: {savedCheckCount} of {savedCheckTotal} checklist items completed
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadAssignment(assignment)}
                              className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              disabled={deletingId === assignment.id}
                              className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                            >
                              {deletingId === assignment.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                You have no saved assignments yet. Save a breakdown and it will stay here between sessions.
              </p>
            )}
          </div>
        )}

        {data && (
          <>
            <div className="mt-8 flex flex-col gap-6">
              <div>
                <div className="mb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                  Step-by-step breakdown
                </div>
                <div className="flex flex-col gap-2">
                  {data.task_breakdown.map((step, index) => (
                    <div
                      key={index}
                      onClick={() => toggleStep(index)}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        doneSteps[index]
                          ? "border-green-200 dark:border-green-800"
                          : openSteps[index]
                            ? "border-neutral-400 dark:border-neutral-500"
                            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-6 min-w-[24px] items-center justify-center rounded-full border text-xs font-medium ${
                            doneSteps[index]
                              ? "border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-300"
                              : "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                          }`}
                        >
                          {doneSteps[index] ? "✓" : index + 1}
                        </div>
                        <div className="flex-1 text-[15px] font-medium">{step.title}</div>
                        <div className="pt-0.5 text-xs text-neutral-400">{openSteps[index] ? "▾" : "▸"}</div>
                      </div>

                      {openSteps[index] && (
                        <div className="mt-3 flex flex-col gap-3 border-t border-neutral-100 pl-9 pt-3 dark:border-neutral-800">
                          <div>
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                              Why this matters
                            </span>
                            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{step.why}</p>
                          </div>
                          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                            {step.explanation}
                          </p>
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                              Hint
                            </div>
                            <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">{step.hint}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => toggleDone(index, event)}
                            className={`w-fit rounded-full border px-3 py-1.5 text-xs transition ${
                              doneSteps[index]
                                ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
                                : "border-neutral-200 text-neutral-500 hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-neutral-700"
                            }`}
                          >
                            {doneSteps[index] ? "Completed" : "Mark complete"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                  Study checklist
                </div>
                <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1">
                  {data.checklist.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => toggleCheck(index)}
                      className={`flex cursor-pointer items-center gap-2 py-1.5 text-sm select-none ${
                        checklist[index]
                          ? "text-neutral-400 line-through"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 min-w-[16px] items-center justify-center rounded border transition ${
                          checklist[index]
                            ? "border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-900"
                            : "border-neutral-300 dark:border-neutral-600"
                        }`}
                      >
                        {checklist[index] && (
                          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
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
                <div className="h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {checkCount} of {checkTotal} done
                </div>
              </div>
            </div>

            {user?.premium && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Save assignment
                </button>
                <span className="text-sm text-neutral-500">
                  Save this breakdown to revisit it from your premium library.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
