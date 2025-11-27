import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faTimes } from '@fortawesome/free-solid-svg-icons';

type SyncOptions = {
  limit: number;
  status: string;
  dateFrom: string;
  dateTo: string;
};

type SyncOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSync: (options: SyncOptions) => Promise<void>;
  isSyncing: boolean;
};

export function SyncOptionsModal({ isOpen, onClose, onSync, isSyncing }: SyncOptionsModalProps) {
  const [limit, setLimit] = useState<number>(50);
  const [status, setStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSync({
      limit,
      status: status || undefined as any,
      dateFrom: dateFrom || undefined as any,
      dateTo: dateTo || undefined as any,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faSync} className="text-blue-500" />
            Sync CloudCart Orders
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" disabled={isSyncing}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Orders (Limit)</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={isSyncing}
            />
            <p className="text-xs text-muted-foreground">Max 100 per sync request.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status Filter (Optional)</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              disabled={isSyncing}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={isSyncing}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={isSyncing}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded text-sm hover:bg-muted/80"
              disabled={isSyncing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <FontAwesomeIcon icon={faSync} className="fa-spin" />
                  Syncing...
                </>
              ) : (
                'Start Sync'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

