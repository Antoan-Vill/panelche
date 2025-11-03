'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

interface CategoryDescriptionProps {
  description: string;
  className?: string;
}

export function CategoryDescription({ description, className }: CategoryDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionId = useId();

  if (!description?.trim()) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2 mt-3', className)}>
      <Button
        variant="ghost"
        size="xs"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={descriptionId}
        type="button"
      >
        <span>{isExpanded ? 'Hide description' : 'Show description'}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', {
            'rotate-180': isExpanded,
          })}
          aria-hidden="true"
        />
      </Button>

      {isExpanded && (
        <div
          id={descriptionId}
          className="basis-full text-muted-foreground mt-2"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  );
}

