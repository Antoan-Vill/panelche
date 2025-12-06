'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { searchCustomersByEmailOrName } from '@/lib/firebase/repositories/customers';
import type { Customer, OrderOwner } from '@/lib/types/customers';
import { useTranslation } from '@/lib/i18n';

interface OwnerSelectorProps {
  selectedOwner: OrderOwner | null;
  onOwnerChange: (owner: OrderOwner | null) => void;
}

export function OwnerSelector({ selectedOwner, onOwnerChange }: OwnerSelectorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'guest' | 'customer'>('customer');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Update mode based on selectedOwner
  useEffect(() => {
    if (selectedOwner) {
      setMode(selectedOwner.kind);
      if (selectedOwner.kind === 'guest') {
        setGuestName(selectedOwner.name || '');
        setGuestEmail(selectedOwner.email);
        setSelectedCustomer(null);
      } else {
        setSelectedCustomer({
          id: selectedOwner.customerId,
          email: selectedOwner.email,
          name: selectedOwner.name,
        });
        setGuestName('');
        setGuestEmail('');
      }
    }
  }, [selectedOwner]);

  // Search customers when customerSearch changes
  useEffect(() => {
    const search = async () => {
      if (customerSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const q = customerSearch.trim().toLowerCase();
        const results = await searchCustomersByEmailOrName(q);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  // Keep quick-add email in sync with search when in customer mode
  useEffect(() => {
    if (mode === 'customer') {
      setCreateEmail(customerSearch.trim().toLowerCase());
    }
  }, [customerSearch, mode]);

  const handleModeChange = (newMode: 'guest' | 'customer') => {
    setMode(newMode);
    setSelectedCustomer(null);
    setGuestName('');
    setGuestEmail('');
    onOwnerChange(null);
  };

  const handleGuestSubmit = () => {
    if (!guestEmail.trim()) return;

    const owner: OrderOwner = {
      kind: 'guest',
      email: guestEmail.trim(),
      name: guestName.trim() || undefined,
    };
    onOwnerChange(owner);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.email);
    setSearchResults([]);

    const owner: OrderOwner = {
      kind: 'customer',
      customerId: customer.id,
      email: customer.email,
      name: customer.name || undefined,
    };
    onOwnerChange(owner);
  };

  const isValidEmail = (value: string) => {
    if (!value) return false;
    const v = value.trim().toLowerCase();
    // Basic email heuristic; server does real validation
    return /.+@.+\..+/.test(v);
  };

  const handleCreateCustomer = async () => {
    setCreateError(null);
    const email = createEmail.trim().toLowerCase();
    if (!isValidEmail(email)) return;
    setCreating(true);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        throw new Error(t('auth.signInRequired'));
      }
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email, name: createName.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || t('ownerSelector.failedToCreate'));
      }

      const customer: Customer = {
        id: data.id,
        email: data.email,
        name: data.name ?? null,
      };
      setSelectedCustomer(customer);
      setCustomerSearch(customer.email);
      setSearchResults([]);
      onOwnerChange({ kind: 'customer', customerId: customer.id, email: customer.email, name: customer.name || undefined });
    } catch (e: any) {
      setCreateError(e?.message || t('ownerSelector.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="uppercase text-xs opacity-50 mb-2 font-bold">{t('ownerSelector.orderOwner')}</h3>

      {/* Mode Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleModeChange('customer')}
          className={`px-4 py-2 rounded border ${
            mode === 'customer'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {t('ownerSelector.existingCustomer')}
        </button>
        <button
          onClick={() => handleModeChange('guest')}
          className={`px-4 py-2 rounded border ${
            mode === 'guest'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {t('ownerSelector.guestCustomer')}
        </button>
      </div>

      {/* Guest Mode */}
      {mode === 'guest' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('ownerSelector.nameOptional')}</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 bg-background"
              placeholder={t('ownerSelector.enterName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('ownerSelector.emailRequired')}</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 bg-background"
              placeholder={t('ownerSelector.emailPlaceholder')}
            />
          </div>
          <button
            onClick={handleGuestSubmit}
            disabled={!guestEmail.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('ownerSelector.setAsGuest')}
          </button>
        </div>
      )}

      {/* Customer Mode */}
      {mode === 'customer' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('ownerSelector.searchByEmailOrName')}</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 bg-background"
              placeholder={t('ownerSelector.startTyping')}
            />
          </div>

          {/* Search Results */}
          {loading && <div className="text-sm text-muted-foreground">{t('ownerSelector.searching')}</div>}

          {!loading && searchResults.length > 0 && (
            <div className="border border-border rounded max-h-40 overflow-y-auto">
              {searchResults.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`w-full text-left px-3 py-2 hover:bg-muted border-b border-border last:border-b-0 ${
                    selectedCustomer?.id === customer.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="font-medium">{customer.name || t('ownerSelector.noName')}</div>
                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                </button>
              ))}
            </div>
          )}

          {!loading && customerSearch.length >= 2 && (searchResults?.length ?? 0) === 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">{t('ownerSelector.noCustomersFound')}</div>
              <div className="border border-border rounded p-3 space-y-3">
                <div className="text-sm font-medium">{t('ownerSelector.createNewCustomer')}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">{t('ownerSelector.email')}</label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value.trim().toLowerCase())}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      placeholder={t('ownerSelector.emailPlaceholder')}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">{t('ownerSelector.nameOptional')}</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full border border-border rounded px-3 py-2 bg-background"
                      placeholder={t('ownerSelector.enterName')}
                    />
                  </div>
                </div>
                {createError && (
                  <div className="text-xs text-red-600">{createError}</div>
                )}
                <button
                  onClick={handleCreateCustomer}
                  disabled={creating || !isValidEmail(createEmail)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? t('ownerSelector.creating') : t('ownerSelector.createCustomer')}
                </button>
              </div>
            </div>
          )}

          {/* Selected Customer */}
          {selectedCustomer && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
              <div className="text-sm font-medium text-green-800 dark:text-green-300">{t('ownerSelector.selectedCustomer')}:</div>
              <div className="text-sm text-green-700 dark:text-green-400">
                {selectedCustomer.name || t('ownerSelector.noName')} ({selectedCustomer.email})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
