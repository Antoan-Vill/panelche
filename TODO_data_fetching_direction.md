# Data Fetching Direction Decision (ADR/TODO)

Status: Draft
Owners: <add names>
Date: <YYYY-MM-DD>
Related: `src/lib/products.ts`, `src/app/api/**`, `src/app/page.tsx`, `src/components/**`

## 1) Context

This dashboard fetches:
- Categories, stats, product lists/details (reads)
- Mutations like variant stock updates

Current patterns:
- `src/lib/products.ts` reads via internal `/api/*` routes (extra hop)
- Mutations via Next Route Handlers (`src/app/api/variants/[variantId]/stock/route.ts`)
- Client rendering on `src/app/page.tsx` using hooks

Constraints:
- Secrets: `SITE_URL`, `CLOUDCART_API_KEY`
- SEO acceptable but not primary concern; dashboard interactivity matters

## 2) Goals

- Reduce client JS and duplicated fetches where possible
- Keep secure usage of secrets on server
- Provide smooth UX for interactive tables (filters, pagination)
- Allow reuse by other clients (only where needed)

## 3) Options

### A) Server Components (RSC) for reads + Server Actions for mutations
- Pros
  - Minimal client JS
  - Direct access to secrets on server
  - Built-in caching with `revalidate` and tag invalidation
  - Streaming support
- Cons
  - Not directly reusable by mobile/external apps
  - Different observability vs HTTP endpoints

### B) REST API routes + Client hooks (React Query) for reads/mutations
- Pros
  - Endpoints reusable by other clients
  - Rich client-side caching, background refresh, optimistic updates
  - Familiar HTTP logging/rate-limits/CDN options
- Cons
  - Extra hop (server → server)
  - More client JS and boilerplate

### C) Hybrid (Recommended baseline)
- Reads default to RSC
- Mutations use Server Actions when internal; API routes when reuse/observability needed
- Client hooks (React Query) only for highly interactive screens

## 4) Decision Criteria

Pick the first that applies:
1) Needed by other clients (mobile/services)?
   - Yes → Prefer API routes (+ React Query on client)
2) Server-rendered UI read without client state dependency?
   - Yes → Prefer RSC (`async` Server Components)
3) Secure/complex mutation with no external reuse?
   - Yes → Prefer Server Actions
4) Need background refetch/optimistic updates/offline?
   - Yes → React Query (client) over the appropriate endpoint or action

## 5) Proposed Direction (to finalize)

- Reads (categories, stats, products): RSC with `fetch` and `revalidate`/`tags`
- Mutations (variant stock):
  - If internal-only → Server Action
  - If external reuse/logging needed → keep Route Handler
- Highly interactive pages (fast filtering/pagination):
  - React Query client hooks, reading from API routes (or actions via wrappers)
- Keep API routes only where reuse or Edge/runtime logging adds value

Finalize here:
- Final choice: <A|B|C>
- Exceptions: <list pages/endpoints that deviate and why>

## 6) Implementation Guidelines

### 6.1 Folder structure
- `src/data/` — server-only fetchers (RSC-friendly, no client import)
- `src/actions/` — Server Actions for mutations
- `src/app/**` — Server Components by default; mark client components with `'use client'`
- `src/lib/http/` — API client utilities (validation, error mapping)
- `src/app/api/**` — Only endpoints intended for reuse or special runtime

### 6.2 RSC Reads

Use Next’s `fetch` with cache control:
```ts
// Example: src/data/categories.ts
export const CATEGORIES_TAG = 'categories';

export async function getCategories() {
  const res = await fetch(`${process.env.SITE_URL}/api/v2/categories`, {
    headers: { 'X-CloudCart-ApiKey': process.env.CLOUDCART_API_KEY! },
    next: { revalidate: 300, tags: [CATEGORIES_TAG] },
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  const json = await res.json();
  return json.data;
}
```

Server Component usage:
```tsx
// Example: src/app/page.tsx
export default async function DashboardPage() {
  const categories = await getCategories();
  return <CategoriesSection categories={categories} />;
}
```

### 6.3 Server Actions (internal mutations)

```ts
// Example: src/actions/updateVariantStock.ts
'use server';

import { revalidateTag } from 'next/cache';

export async function updateVariantStock(input: { variantId: string; quantity: number }) {
  const res = await fetch(`${process.env.SITE_URL}/api/v2/variants/${input.variantId}`, {
    method: 'PATCH',
    headers: {
      'X-CloudCart-ApiKey': process.env.CLOUDCART_API_KEY!,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify({ data: { type: 'variants', id: input.variantId, attributes: { quantity: input.quantity } } }),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
  revalidateTag(`variant:${input.variantId}`);
  return res.json();
}
```

Client usage with optimistic UI:
```tsx
'use client';
import { useTransition } from 'react';
import { updateVariantStock } from '@/actions/updateVariantStock';

export function VariantStockForm({ variantId, initialQty }: { variantId: string; initialQty: number }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => updateVariantStock({ variantId, quantity: initialQty + 1 }))}
    >
      Increment
    </button>
  );
}
```

### 6.4 API Routes (reuse/observability)

Keep or create Route Handlers if:
- Mobile/external clients consume them
- Need standard HTTP logs, rate limiting, or Edge runtime

Validation example with Zod:
```ts
import { z } from 'zod';
const Body = z.object({ quantity: z.number().finite() });
```

### 6.5 React Query (interactive UX)

Use for:
- Fast filter/search UIs
- Background refetch, pagination, infinite scroll
- Local mutations with optimistic updates

Pattern:
```ts
// useProducts.ts
import { useQuery } from '@tanstack/react-query';

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await fetch(`/api/products?${new URLSearchParams(params)}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
```

## 7) Caching & Invalidation

- RSC: use `next: { revalidate, tags }`
- Invalidate on mutations with `revalidateTag`
- For paginated lists, include paramized tags (e.g., `products:category:${slug}:page:${n}`) or a coarser tag per category and refetch client-side

## 8) Security

- Secrets accessed only on server (RSC fetchers, Actions, Route Handlers)
- Never embed `SITE_URL`/`CLOUDCART_API_KEY` in client bundles
- Rate limit public API routes as needed

## 9) Error Handling

- Map upstream errors to meaningful UI messages
- For API routes, return typed error bodies
- For RSC, throw and render via error boundary segment:
  - `src/app/<segment>/error.tsx`

## 10) Observability

- API routes: standard logs/metrics
- Server Actions: add structured logging around mutation boundaries
- Consider request IDs and correlation on both paths

## 11) Testing

- Unit test fetchers (mocks)
- Unit test Actions (mutation paths + invalidation)
- Integration test critical API routes
- Light e2e for main flows

## 12) Migration Plan (from current repo)

1) Replace internal reads in `src/lib/products.ts` with server-only fetchers in `src/data/` using RSC
2) Convert page components to Server Components where possible
3) For `variants/.../stock`, decide:
   - keep Route Handler (external reuse) OR
   - move to Server Action
4) Introduce React Query on pages needing client interactivity
5) Add invalidation tags and wire `revalidateTag` in mutation paths
6) Remove redundant client-side fetching where RSC now covers reads

## 13) Rollout Checklist

- [ ] Decision finalized in section 5
- [ ] Secrets access audited (server-only)
- [ ] RSC fetchers added and wired
- [ ] Mutations implemented via Actions or API routes
- [ ] Invalidation strategy verified
- [ ] Interactive pages use React Query where needed
- [ ] Tests updated
- [ ] Monitoring/alerts configured for API routes

## 14) Open Questions

- Which endpoints must be reusable by other clients?
- Any Edge runtime or CORS requirements?
- Required SLOs for interactive views?
