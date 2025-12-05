'use client';

import { useDataSource, DataSource } from '@/lib/contexts/data-source-context';

interface DataSourceSelectorProps {
  className?: string;
  variant?: 'buttons' | 'radio';
}

export function DataSourceSelector({ 
  className = '', 
  variant = 'buttons' 
}: DataSourceSelectorProps) {
  const { source, setSource } = useDataSource();

  const options: { value: DataSource; label: string }[] = [
    { value: 'cloudcart', label: 'CC' },
    { value: 'firestore', label: 'FS' },
  ];

  if (variant === 'radio') {
    return (
      <div className={`data-source-selector flex gap-4 ${className}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name="data-source"
              value={option.value}
              checked={source === option.value}
              onChange={() => setSource(option.value)}
              className="w-4 h-4 text-primary border-border focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className={`data-source-selector flex gap-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setSource(option.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${source === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }
          `}
          aria-pressed={source === option.value}
          aria-label={`Switch to ${option.label}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default DataSourceSelector;
