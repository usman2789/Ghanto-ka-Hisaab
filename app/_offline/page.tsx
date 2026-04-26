export default function Offline() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center">
      <div className="max-w-md rounded-lg border-2 border-zinc-900 bg-white p-8 shadow-[4px_4px_0_0_#323232]">
        <h1 className="mb-4 text-4xl font-bold text-zinc-900">You are offline</h1>
        <p className="text-lg text-zinc-600">
          Ghanto ka Hisaab will use cached screens and offline data when available. Reconnect if this is your first time opening the app on this device.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="px-6 py-3 rounded-lg border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
          >
            Open Dashboard
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
