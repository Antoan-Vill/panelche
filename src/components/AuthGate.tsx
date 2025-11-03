'use client';

import { useAuth } from '@/lib/firebase/auth-context';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) return null;
  if (!user) return (
    <div className="w-full h-dvh flex items-center justify-center">
      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={signInWithGoogle}
      >
        Sign in with Google
      </button>
    </div>
  );

  return <>{children}</>;
}


