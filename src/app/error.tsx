'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
        <h2 className="font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm mb-4">{error.message || 'Unknown error'}</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}


