# Order Saving Implementation Report

This document summarizes the changes implemented to enable saving admin-created orders in the dashboard.

## Overview
- Persist orders created from the admin UI under `users/{ownerId}/orders/{orderId}` in Firestore.
- Use Firebase Admin SDK on the server to bypass client rules safely.
- Support both existing customers and guest owners.

## Dependencies
- Added: `firebase-admin`
- Added (peer requirement): `@opentelemetry/api`

## Environment Variables
Add the following to `.env.local` (or your hosting provider's env). The private key can be pasted as a single line with `\\n` escapes, or as a proper multiline string.

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\\n...\n-----END PRIVATE KEY-----\n"
```

Notes:
- `src/lib/firebase/admin.ts` normalizes quoted keys and converts `\\n` to newlines.
- The project ID must match the service account’s project.

## Files Added / Updated

### Added: `src/lib/firebase/admin.ts`
- Initializes Firebase Admin app and exports `adminDb`.
- Ensures server-only usage.

Key points:
- Converts escaped newlines in `FIREBASE_PRIVATE_KEY`.
- Uses `cert({ projectId, clientEmail, privateKey })`.

### Added: `src/app/api/admin/orders/route.ts`
- POST API to create an order on behalf of an owner.
- Uses `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` to keep it server-only and avoid edge bundling.
- Verifies Firebase ID token from `Authorization: Bearer <token>`.
- Writes order under `users/{ownerId}/orders` with `createdAt: serverTimestamp()`.

Request body shape:
```json
{
  "owner": { "kind": "customer", "customerId": "...", "email": "...", "name": "..." },
  "items": [
    {
      "productId": "...",
      "productName": "...",
      "sku": null,
      "variantId": "...",
      "quantity": 1,
      "unitPrice": 9.99,
      "totalPrice": 9.99,
      "imageUrl": null
    }
  ],
  "subtotal": 9.99,
  "total": 9.99
}
```

Owner resolution:
- Existing customer: `ownerId = owner.customerId`.
- Guest: `ownerId = "guest:" + owner.email.toLowerCase()`.

### Updated: `src/components/organisms/AdminOrderCreate.tsx`
- Added `saving`/`error` state and `handleSave()`.
- Builds `OrderItem[]` from selected cart items.
- Retrieves Firebase ID token via `getAuth().currentUser?.getIdToken()`.
- Uses `useCreateOrder()` client hook to call `POST /api/admin/orders` with `{ owner, items, subtotal, total }` (handles idempotency header and error normalization).
- Resets state on success.
- Replaced bottom button with a disabled-aware "Save Order" button.

## Data Model & Storage Path
- Orders are stored at: `users/{ownerId}/orders/{orderId}`.
- Each order document contains:
  - `userId`, `status`, `items[]`, `subtotal`, `total`, `createdAt`.
- This is compatible with the existing admin list page that uses `collectionGroup('orders')`.

## Security
- The admin API route verifies the caller’s Firebase ID token on every request.
- Firestore writes happen via Admin SDK; client security rules do not block this server-side action.

## How to Use (Manual Test)
1. Ensure you are signed in to the admin area.
2. Navigate to `/admin/orders/create`.
3. Select an order owner (guest or existing customer).
4. Add products to the cart (and variants where applicable).
5. Click "Save Order".
6. Check `/admin` orders list to see the newly created order.

## Troubleshooting
- "Cannot find module '@opentelemetry/api'": install `@opentelemetry/api`.
- "Unauthorized": you must be signed in; the API requires an ID token.
- Private key issues: ensure proper quoting and `\\n` escape handling as shown above.
- If deploying, set the same env vars in your hosting provider and redeploy.

## Admin-only Access & Idempotency
- Admin access enforcement:
  - API verifies Firebase ID token and requires either `admin` custom claim or email allowlist (`ADMIN_EMAILS=admin1@example.com,admin2@example.com`).
- Idempotency:
  - Client sends `Idempotency-Key` header (UUID) with each submission.
  - Server stores key under `idempotency/{key}` and returns existing order if already processed.

## Pricing Representation
- Server normalizes prices to integer cents (and still stores floats for compatibility):
  - `items[].unitPriceCents`, `items[].totalPriceCents`, `subtotalCents`, `totalCents` added.
  - Floats `unitPrice`, `totalPrice`, `subtotal`, `total` kept for current UI.

## Firestore Rules
Updated `firebase/firestore.rules`:
- `users/{uid}/orders/{orderId}`
  - read: owner or admin
  - create: owner
  - update: admin
- `/{path=**}/orders/{orderId}` (collection group)
  - read/update: admin only

## QA Checklist
- Sign in as admin, create order → list shows new order (id present).
- Non-admin: POST /api/admin/orders returns 403.
- Submit same order twice → returns same order id (Idempotency-Key).
- Prices compute correctly; `*_Cents` fields are integers.

## Optional Next Step
- Adjust stock after saving: loop variant lines and call `PATCH /api/variants/{variantId}/stock` with the desired quantity.

## Rationale
- Server-side creation via Admin SDK allows creating orders for any owner safely.
- Storing under `users/{ownerId}/orders` preserves compatibility with existing admin pages and collection group queries.


