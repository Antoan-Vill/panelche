## Next.js Dashboard

### Executive summary
- Next.js App Router with server-first data fetching. Home and category pages are Server Components with route-level `loading.tsx` and `error.tsx`.
- Centralized service layer (`src/lib/services/cloudcart.ts`) for CloudCart API; shared configuration in `src/lib/env.ts` and `src/lib/http/*`.
- Reads via lightweight client hooks (SWR-ready); mutations via typed REST APIs and client hooks (no server actions required).
- Shared Zod schemas under `src/schemas/*` validate API I/O and infer types.
- Dynamic route `params` and `searchParams` use the Promise form and are awaited to comply with Next.js guidance.
- Light revalidation-based caching is applied for reads via `src/lib/cache.ts`.

---

## Architecture

### App Router and Server Components (RSC)
- Home (`src/app/page.tsx`): Server Component fetching categories and stats server-side; passes data to presentational components.
- Category (`src/app/categories/[slug]/page.tsx`): Server Component fetching category and product listings; product images resolved server-side; variants are fetched on demand on the client per product.
- Route boundaries:
  - `src/app/loading.tsx` and `src/app/error.tsx`
  - `src/app/categories/[slug]/loading.tsx` and `src/app/categories/[slug]/error.tsx`

### Data layer
- Env configuration: `src/lib/env.ts`
  - Exposes `SITE_URL`, `CLOUDCART_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- HTTP helpers: `src/lib/http/*`
  - `http<T>()` and `fetchJson<T>()` for consistent fetch; `response.ts` with `ok/error` helpers.
- CloudCart service: `src/lib/services/cloudcart.ts`
  - `getProductsByCategory`, `getCategoryBySlug`, `getProductVariants`, `getImageDetails`, `updateVariantStock`.
- Zod schemas: `src/schemas/{product,variant,category,order}.ts`
  - Shared validation and types across API and UI.
- Local app-facing libs:
  - `src/lib/categories.ts`: fetches categories from local API with revalidation.
  - `src/lib/stats.ts`: fetches stats from local API with revalidation.
- Caching: `src/lib/cache.ts`
  - Revalidation constants: `categories: 300s`, `products: 60s`, `stats: 60s`.

### Types
- `src/lib/types/products.ts`: `Product`, `Variant`, `ImageData`, `ProductsResponse`, `PaginationMeta`.
- `src/lib/types/categories.ts`: `Category`.
- Code imports from `@/lib/types/*` to reduce duplication/drift.

### UI composition
- Atomic design: `src/components/atoms`, `molecules`, `organisms`, `templates`.
- Notable organisms:
  - `StatsSection`: renders KPIs from server-provided data.
  - `CategoriesSection`: list of categories (single source; legacy duplicate removed).
  - `ActionsPanel`, `ActivityFeed`: presentational.
- Variants UX:
  - `ProductVariants` (client): lazy loads variants via `/api/products/[id]/variants` using a client hook.
  - `VariantItem` + `VariantStockManager` (client): inline stock editing via `PATCH /api/variants/{variantId}/stock` through a client hook.
  - `src/lib/variant-visibility.tsx`: shared UI visibility state for variants.

### Pages and routes
- Home: `src/app/page.tsx`
  - Server fetches via `getCategories()` and `getDashboardStats()` (revalidated) and renders immediately.
- Category: `src/app/categories/[slug]/page.tsx`
  - Awaits `params` and `searchParams` Promises.
  - Fetches category first; if not found -> `notFound()`.
  - Fetches products with revalidation; failures fall back to empty payload.
  - Adds `generateMetadata` based on category attributes.
  - Renders `ProductVariants` per product with a server action for stock updates.

### API routes
- Categories (existing):
  - `src/app/api/categories/route.ts`
  - `src/app/api/categories/[slug]/route.ts`
  - `src/app/api/categories/[slug]/products/route.ts`
- Stats (existing): `src/app/api/stats/route.ts`
- Variants:
  - GET `src/app/api/products/[id]/variants/route.ts`
    - Awaits Promise `params`; delegates to service.
  - PATCH `src/app/api/variants/[variantId]/stock/route.ts`
    - Awaits Promise `params`; delegates to service; returns `{ success: true, data }` on success.
 - Admin Customers:
   - POST `src/app/api/admin/customers/route.ts`
     - Admin-only (admin claim or `ADMIN_EMAILS`).
     - Idempotent create-by-email: lowercases email; document ID = email.
     - Response: `{ id, email, name }` (200 if existing, 201 if created).

### Client hooks (SWR-ready)
- `src/features/categories/hooks.ts`: `useCategories`, `useCategoryProducts(slug)`
- `src/features/products/hooks.ts`: `useProductVariants(productId)`
- `src/features/variants/mutations.ts`: `useUpdateVariantStock(variantId)`
- `src/features/orders/hooks.ts`: `useCreateOrder()`

### Data flow
- Home: RSC fetches categories and stats; no client fetching required for these props.
- Category: RSC fetches category and products; client fetches variants per product when expanded/visible; stock updates use a client hook to call REST.

### Error handling and 404s
- Dynamic route params:
  - All dynamic routes use Promise-style `params` and `searchParams`, unwrapped with `await`.
- 404 behavior:
  - Category page calls `notFound()` if the category request fails or returns null.
- Errors:
  - Route-level `error.tsx` shows friendly UI with a reset button.
  - Service functions throw with status codes; API routes convert to appropriate HTTP responses.

### Caching
- Revalidation: `categories: 300s`, `products: 60s`, `stats: 60s`.
- Mutation endpoints remain non-cached or `no-store`.

---

## Environment & setup

### Required env vars
- `SITE_URL`: CloudCart site base URL (server-only)
- `CLOUDCART_API_KEY`: CloudCart API key (server-only)
- `NEXT_PUBLIC_APP_URL`: Base URL for this dashboard (defaults to `http://localhost:3000`)

Create `.env.local`:
```bash
SITE_URL="https://your-cloudcart-site"
CLOUDCART_API_KEY="your-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Firebase (client-only auth)
Add these public keys to `.env.local` to enable Firebase Auth and Firestore:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
```

### Firestore collections

#### customers
- Document ID: lowercased email (e.g., `user@example.com`).
- Fields:
  - `email`: lowercased string (same as document ID)
  - `name`: string | null
  - `createdAt`: server timestamp
- Client rules (admin-only reads):
  ```
  match /customers/{customerId} {
    allow read: if request.auth != null && request.auth.token.admin == true;
  }
  ```
- Writes: via Admin SDK in `POST /api/admin/customers` only (no client writes).

### Install & run
```bash
npm install
npm run dev
# open http://localhost:3000
```

---

## Development workflow

### Where to put data calls
- Prefer adding new CloudCart integrations in `src/lib/services/cloudcart.ts`.
- Use `fetchJson` for consistent error handling.

### When to use Server Actions
- Use for mutations initiated from internal UI.
- Keep public/external access via API routes when needed for compatibility or non-RSC consumers.

### Coding guidelines (abridged)
- Server-first reads, client-only for interactivity.
- Strong typing via `src/schemas/*` (Zod) and `src/lib/types/*`; avoid `any`.
- Centralized env and services; do not access `process.env` from random modules.
- Keep components presentational; data fetching in RSC or services.

---

## Contributing

### Branching & commits
- Branch naming: `feat/...`, `fix/...`, `chore/...`, `refactor/...`.
- Commits: imperative, concise, and scoped (e.g., `refactor(rsc): move stats fetch to server`).

### PR guidelines
- Include a short description, screenshots if UI changes.
- Note any data/API changes.
- Ensure no type or linter errors.

### Code expectations
- Prefer RSC for reads; only add client components for interactivity.
- Place CloudCart calls in `src/lib/services/cloudcart.ts`.
- Add or update types in `src/lib/types/*`.
- Use `fetchJson` and `env` helpers.

---

## ADRs (Architecture Decision Records)

### ADR-001: Server-first reads with RSC
Context: App Router allows Server Components with streaming and revalidation.
Decision: Fetch categories, stats, and category products in RSC; pass data to presentational components.
Consequences: Faster TTFB and simpler client components; data kept server-side.

### ADR-002: Mutations via Server Actions with REST fallback
Context: Internal dashboard needs secure mutations; external clients may require REST.
Decision: Use Server Actions for stock updates; expose REST routes for compatibility and fallback.
Consequences: Minimal client code, authentication stays server-side; API remains usable by tools.

### ADR-003: Centralized service layer and types
Context: API calls and types drift when defined ad hoc.
Decision: Consolidate CloudCart calls in `src/lib/services/cloudcart.ts`; move domain types to `src/lib/types/*`.
Consequences: Single source of truth, easier refactors, consistent error handling.

### ADR-004: Promise-style dynamic params
Context: Next.js App Router surfaces `params`/`searchParams` as Promises in some contexts.
Decision: Use Promise signatures and `await` in pages and API routes.
Consequences: Eliminates runtime errors; aligns with Next.js recommendations.

---

## Appendix: Useful paths
- `src/app/page.tsx` — Home (RSC)
- `src/app/categories/[slug]/page.tsx` — Category (RSC)
- `src/app/api/products/[id]/variants/route.ts` — Variants GET API
- `src/app/api/variants/[variantId]/stock/route.ts` — Stock PATCH API
- `src/lib/env.ts` — Env helper
- `src/lib/http/*` — HTTP helpers and response helpers
- `src/lib/services/cloudcart.ts` — CloudCart service
- `src/lib/cache.ts` — Revalidation constants
- `src/lib/types/*` — Domain types
 - `src/schemas/*` — Shared Zod schemas
