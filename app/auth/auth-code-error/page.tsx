export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
          Authentication Error
        </h1>
        <p className="mt-4 text-zinc-700 dark:text-zinc-300">
          Sorry, we couldn&apos;t log you in. Please try again.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
