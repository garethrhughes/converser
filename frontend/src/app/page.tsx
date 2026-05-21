'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-20 px-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Welcome to Converser
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12 text-center max-w-lg">
          Ingest conversations, parse them with AI agents, and report on themes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link
            href="/agents"
            className="block border border-zinc-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-700 dark:hover:border-blue-600"
          >
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Agents
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create and manage AI agents with custom instructions for parsing conversations.
            </p>
          </Link>

          <Link
            href="/contexts"
            className="block border border-zinc-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all dark:border-zinc-700 dark:hover:border-blue-600"
          >
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Contexts
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Define contexts that provide background information for agent conversations.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
