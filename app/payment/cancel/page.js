import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">Payment canceled</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Your payment was not completed. You can try again or continue using the free upload allowance.
        </p>
        <Link href="/">
          <span className="inline-flex cursor-pointer rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Back to app
          </span>
        </Link>
      </div>
    </main>
  );
}
