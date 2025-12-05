'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heading } from '@/components/atoms/Heading';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/lib/firebase/auth-context';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

interface DashboardHeaderProps {
  title?: string;
  actions?: Array<{
    label: string | React.ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  }>;
}

export function DashboardHeader({
  title,
  actions = []
}: DashboardHeaderProps) {
  const { t } = useTranslation();
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  
  const displayTitle = title || t('dashboard.title');

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('click', onDocClick);
    }
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  function getInitials() {
    const name = user?.displayName || user?.email || '';
    const first = name.trim()[0] || 'U';
    return first.toUpperCase();
  }

  const handleCopyUserId = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy user ID:', err);
    }
  };

  return (
    <header className="bg-card bg-gray-50 -shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* back */}
          <div className="flex items-center justify-between w-full me-4 py-2 pe-4 border-border border-r ">
            <div className="flex flex-col space-x-2">
              {/* <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">&#60;&#60; Back to Dashboard</Link> */}
              <Heading level={1}>{displayTitle}</Heading>
            </div>
            <div>
              <Link href="/admin/catalog" className="p-3 text-sm text-muted-foreground hover:text-foreground transition-colors" title={t('actions.manageCatalog')}>{t('actions.manageCatalog')}</Link>
              <Link href="/admin/orders" className="p-3 text-sm text-muted-foreground hover:text-foreground transition-colors" title={t('orders.title')}>{t('orders.title')}</Link>
              {/* <Link href="/admin/customers" className="p-3 text-sm text-muted-foreground hover:text-foreground transition-colors">Customers</Link> */}
              {/* <Link href="/admin/settings" className="p-3 text-sm text-muted-foreground hover:text-foreground transition-colors">Settings</Link> */}
            </div>
          </div>
          <div className="flex items-center space-x-4 relative">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Optional external actions if provided (no default New Item) */}
            {actions?.length ? (
              actions.map((action, index) => {
                // If label is a React element (like CartButton), render it directly
                if (React.isValidElement(action.label)) {
                  return (
                    <div key={index} onClick={action.onClick}>
                      {action.label}
                    </div>
                  );
                }
                // Otherwise render as a Button component
                return (
                  <Button
                    key={index}
                    variant={action.variant}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                );
              })
            ) : null}

            {/* Auth area */}
            {loading ? null : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center gap-3"
                  onClick={() => setMenuOpen(v => !v)}
                >
                  <div className="text-right hidden sm:block">
                    <div
                      className="text-sm font-medium text-foreground leading-none cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUserId();
                      }}
                      title="Кликни за копиране на потребителски ID"
                    >
                      {user.displayName || user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    {copied && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {t('success')}
                      </div>
                    )}
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      title="Профил"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                      {getInitials()}
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-10">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.displayName || t('auth.login')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {!pathname.startsWith('/store') && (
                        <>
                          {pathname !== '/' && (
                            <Link href="/" onClick={() => setMenuOpen(false)}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                              >
                                {t('dashboard.title')}
                              </Button>
                            </Link>
                          )}
                          {pathname !== '/admin' && (
                            <Link href="/admin" onClick={() => setMenuOpen(false)}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                              >
                                {t('dashboard.title')}
                              </Button>
                            </Link>
                          )}
                          <Link href="/store" onClick={() => setMenuOpen(false)}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                            >
                              {t('store.title')}
                            </Button>
                          </Link>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                      >
                        {t('auth.logout')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => signInWithGoogle()}>{t('auth.login')}</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
