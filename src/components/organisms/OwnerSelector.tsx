'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { searchCustomersByEmailPrefix } from '@/lib/firebase/repositories/customers';
import type { Customer, OrderOwner } from '@/lib/types/customers';

interface OwnerSelectorProps {
  selectedOwner: OrderOwner | null;
  onOwnerChange: (owner: OrderOwner | null) => void;
}

export function OwnerSelector({ selectedOwner, onOwnerChange }: OwnerSelectorProps) {
  const [mode, setMode] = useState<'guest' | 'customer'>('guest');
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
        const results = await searchCustomersByEmailPrefix(q);
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
        throw new Error('You must be signed in.');
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
        throw new Error(data?.error || 'Failed to create customer');
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
      setCreateError(e?.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-medium mb-4">Order Owner</h3>

      {/* Mode Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleModeChange('guest')}
          className={`px-4 py-2 rounded border ${
            mode === 'guest'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Guest Customer
        </button>
        <button
          onClick={() => handleModeChange('customer')}
          className={`px-4 py-2 rounded border ${
            mode === 'customer'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Existing Customer
        </button>
      </div>

      {/* Guest Mode */}
      {mode === 'guest' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name (optional)</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="customer@example.com"
            />
          </div>
          <button
            onClick={handleGuestSubmit}
            disabled={!guestEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set as Guest Customer
          </button>
        </div>
      )}

      {/* Customer Mode */}
      {mode === 'customer' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search by Email</label>
            <input
              type="email"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Start typing email..."
            />
          </div>

          {/* Search Results */}
          {loading && <div className="text-sm text-muted-foreground">Searching...</div>}

          {!loading && searchResults.length > 0 && (
            <div className="border border-border rounded max-h-40 overflow-y-auto">
              {searchResults.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 ${
                    selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{customer.name || 'No name'}</div>
                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                </button>
              ))}
            </div>
          )}

          {!loading && customerSearch.length >= 2 && searchResults.length === 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">No customers found</div>
              <div className="border border-border rounded p-3 space-y-3">
                <div className="text-sm font-medium">Create new customer</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value.trim().toLowerCase())}
                      className="w-full border rounded px-3 py-2"
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">Name (optional)</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Enter customer name"
                    />
                  </div>
                </div>
                {createError && (
                  <div className="text-xs text-red-600">{createError}</div>
                )}
                <button
                  onClick={handleCreateCustomer}
                  disabled={creating || !isValidEmail(createEmail)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating…' : 'Create customer'}
                </button>
              </div>
            </div>
          )}

          {/* Selected Customer */}
          {selectedCustomer && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="text-sm font-medium text-green-800">Selected Customer:</div>
              <div className="text-sm text-green-700">
                {selectedCustomer.name || 'No name'} ({selectedCustomer.email})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
