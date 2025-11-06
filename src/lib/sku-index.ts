export type PriceRow = {
  SKU: string | number;
  'angro-offseason': number;
  'angro-inseason': number;
  'end-price-offseason': number;
  'end-price': number;
  'end-price-inseason': number;
};

const normalizeSku = (sku: string | number) => {
  let hyphenCount = 0;
  // check if start with "EM "
  if (String(sku).startsWith('EM ')) {
    sku = String(sku).slice(3).trim();
  }

  // get teh "-", count it, and if are 2, remove the last one
  hyphenCount = String(sku).split('-').length - 1;
  if (hyphenCount === 2) {
    sku = String(sku).split('-').slice(0, -1).join('-');
  }
  
  console.log('sku', String(sku).trim().toUpperCase());

  return String(sku).trim().toUpperCase();
};

/** One row per SKU: last one wins if duplicates exist */
export function buildSkuIndex(rows: PriceRow[]) {
  const m = new Map<string, PriceRow>();
  for (const r of rows) m.set(normalizeSku(r.SKU), r);
  return m;
}

export function lookupSku(sku: string | number, index: Map<string, PriceRow>) {
  return index.get(normalizeSku(sku)) ?? null;
}



import SS2021 from '../../data/modeli-ceni/SS2021.json';
import FW2021 from '../../data/modeli-ceni/FW2021.json';
import SS2022 from '../../data/modeli-ceni/SS2022.json';
import FW2022 from '../../data/modeli-ceni/FW2022.json';
import SS2023 from '../../data/modeli-ceni/SS2023.json';
import FW2023 from '../../data/modeli-ceni/FW2023.json';
import SS2024 from '../../data/modeli-ceni/SS2024.json';
import FW2024 from '../../data/modeli-ceni/FW2024.json';
import SS2025 from '../../data/modeli-ceni/SS2025.json';
import FW2025 from '../../data/modeli-ceni/FW2025.json';

const all = [
  ...(SS2021 as PriceRow[]),
  ...(FW2021 as PriceRow[]),
  ...(SS2022 as PriceRow[]),
  ...(FW2022 as PriceRow[]),
  ...(SS2023 as PriceRow[]),
  ...(FW2023 as PriceRow[]),
  ...(SS2024 as PriceRow[]),
  ...(FW2024 as PriceRow[]),
  ...(SS2025 as PriceRow[]),
  ...(FW2025 as PriceRow[])];
const priceIndex = buildSkuIndex(all);
export { priceIndex };

/** Optional: keep all rows per SKU (if you need duplicates) */
// export function buildSkuMultiIndex(rows: PriceRow[]) {
//   const m = new Map<string, PriceRow[]>();
//   for (const r of rows) {
//     const k = normalizeSku(r.SKU);
//     const arr = m.get(k);
//     if (arr) arr.push(r);
//     else m.set(k, [r]);
//   }
//   return m;
// }