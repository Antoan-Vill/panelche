### Multi-Variant Selection: What’s in this functionality

#### Overview
- Introduces a modal-driven multi-variant selection flow that activates only when a user taps a second variant.
- Keeps the existing single-select behavior unchanged by default and on the storefront.
- Allows per-variant quantities, displays variant price/SKU/stock, and batches additions to the admin cart.

#### User flows
- Single-select (existing):
  - Tap a single variant and press Add to add one line to the cart.
- Pivot to multi-select (admin only):
  - First tap selects a variant inline. When a different second variant is tapped, a modal opens.
  - The modal lists all variants with checkboxes and a quantity input per selected variant.
  - Confirm adds one cart line per selected variant (with its own quantity) and closes the modal.
  - Cancel or clicking the overlay/Escape closes the modal without adding.

#### Components and props
- VariantSelector (`src/components/molecules/VariantSelector.tsx`)
  - New optional props:
    - `enablePivotToMulti?: boolean` – enables second-tap pivot into the modal.
    - `onRequestMultiSelect?: (ctx: { initialSelectedIds: string[] }) => void` – invoked when the user taps a second distinct variant.
  - Backward compatible: storefront and any callsites not opting into `enablePivotToMulti` remain single-select with the same `onAdd` contract.

- VariantMultiSelectModal (`src/components/organisms/VariantMultiSelectModal.tsx`)
  - Props: `{ productId, productName, imageUrl?, baseSku?, priceCents?, variants, initialSelectedIds, onCancel, onConfirm }`.
  - Behavior:
    - Seeds initial selection from `initialSelectedIds` (deduped by state logic) with quantity default 1.
    - Shows label, SKU, price (cents→units), and stock (quantity) per variant.
    - Focus-trapped, closes on Escape/overlay click.
    - Confirm returns an array of `{ variantId, quantity, unitPrice, sku }` for each selected variant.
    - Self-closes after `onConfirm(items)` by calling `onCancel()` to ensure the overlay always closes.
    - Prices fallback to `priceCents` when a variant’s own price is missing.

#### Integration in admin
- `AdminProductPicker` (`src/components/organisms/AdminProductPicker.tsx`)
  - Passes `enablePivotToMulti` to `VariantSelector`.
  - Handles `onRequestMultiSelect` by opening `VariantMultiSelectModal` and seeding `initialSelectedIds` with the previously selected and the newly tapped variant IDs.
  - On modal confirm:
    - Iterates items and calls `onAddToCart` once per selected variant.
    - Closes modal, clears initial selection state, and collapses the product row.
  - Added a small `sleep` helper for polite background prefetching (unrelated to functionality but removed a lint error for missing symbol).

#### Cart and order logic updates
- `AdminOrderCreate` (`src/components/organisms/AdminOrderCreate.tsx`)
  - `handleAddToCart` now uses a functional `setCartItems` update to avoid lost updates if multiple items are added rapidly (e.g., from the modal).
  - Merges by `productId + variantId`: existing lines increment quantity and recompute `lineTotal`.
  - `OrderItem` mapping includes `angroPrice: 0` to satisfy typing (adjust when a value is available).

#### Edge cases and safeguards
- Empty variants: modal won’t render selections; confirm disabled when nothing selected.
- Price fallback: per-variant price used when available; falls back to `priceCents`.
- SKU fallback: uses variant SKU, falls back to product base SKU.
- Stock display: shows variant `attributes.quantity` when numeric.
- Quantity validation: coerced to integer ≥ 1.
- Stable ordering: confirm maps variants in list order, filtered by selection.
- Double-close safe: modal closes itself after `onConfirm`, and parent also closes in its handler.

#### Storefront behavior
- `AddToCart` remains single-select and unchanged. No pivot or modal enabled in storefront.

#### Files touched
- Updated:
  - `src/components/molecules/VariantSelector.tsx` – pivot props and click handler; preserves single-select.
  - `src/components/organisms/AdminProductPicker.tsx` – integrates modal, passes pivot props, closes modal on confirm.
  - `src/components/organisms/AdminOrderCreate.tsx` – concurrency-safe cart updates; `angroPrice` in order items.
- Added:
  - `src/components/organisms/VariantMultiSelectModal.tsx` – modal component with a11y and per-variant quantity controls.

#### QA checklist
- Single-select still adds one item with correct price and SKU.
- Second-tap on another variant opens modal with both preselected at qty=1.
- Adjusting per-variant quantities reflects in cart lines after confirm.
- Modal closes after confirm and cancel; Escape/overlay close work.
- Edge cases: no variants, missing prices, rapid confirms do not duplicate or lose items.

#### Usage notes
- To enable pivot behavior in other admin contexts, pass `enablePivotToMulti` and handle `onRequestMultiSelect` to open the modal.
- Storefront should not pass `enablePivotToMulti` to keep the simple UX.


