export default function Offline() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold mb-4">You're offline</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Please reconnect to the internet to continue using Ghanto ka Hisaab.
        </p>
        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
