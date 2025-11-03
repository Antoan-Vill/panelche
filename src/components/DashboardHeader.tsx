"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';

export function DashboardHeader() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  function getInitial() {
    const name = user?.displayName || user?.email || '';
    return (name.trim()[0] || 'U').toUpperCase();
  }

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center space-x-4 relative">
            {loading ? null : user ? (
              <div className="relative" ref={menuRef}>
                <button className="flex items-center gap-3" onClick={() => setMenuOpen(v => !v)}>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-foreground leading-none">{user.displayName || user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                      {getInitial()}
                    </div>
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-10">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-foreground truncate">{user.displayName || 'Signed in'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setMenuOpen(false); logout(); }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                onClick={() => signInWithGoogle()}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
