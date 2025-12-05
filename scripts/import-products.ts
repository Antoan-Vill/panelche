/**
 * Import products from CSV to Firestore
 * 
 * Usage: npx tsx --env-file=.env.local scripts/import-products.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview what would be imported without writing to Firestore
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin initialization
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin credentials. Check your .env.local file.');
  process.exit(1);
}

// Normalize private key
if (privateKey.startsWith('"') || privateKey.startsWith("'")) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

const app = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

const db = getFirestore(app);

// CSV column indices (0-based)
const COL = {
  ROW_NUM: 0,
  SKU: 1,
  NAME: 2,
  CATEGORY: 3,
  MODEL: 4,
  COMPOSITION: 5,
  COLOR: 6,
  PRICE_WHOLESALE_OFF_SEASON: 7,
  PRICE_WHOLESALE: 8,
  PRICE_ONLINE_DISCOUNTED: 9,
  PRICE_RETAIL: 10,
  PRICE_PROMO_25: 11,
};

interface ProductPrice {
  type: string;
  value: number;
}

interface ProductAttributes {
  name: string;
  description: string;
  price: number;
  sku: string;
  categories: Array<{ id: string; name: string }>;
  color: string;
  composition: string;
  prices: ProductPrice[];
}

interface Product {
  id: string;
  type: 'products';
  attributes: ProductAttributes;
}

interface CategoryAttributes {
  name: string;
  description?: string;
  url_handle: string;
  image_url?: string;
  order: number;
  parent_id?: number | null;
}

interface Category {
  id: string;
  type: 'categories';
  attributes: CategoryAttributes;
}

// Latin to Cyrillic lookalike replacements (common typos in Bulgarian text)
const LATIN_TO_CYRILLIC: Record<string, string> = {
  'a': 'а', 'A': 'А',
  'e': 'е', 'E': 'Е',
  'o': 'о', 'O': 'О',
  'p': 'р', 'P': 'Р',
  'c': 'с', 'C': 'С',
  'x': 'х', 'X': 'Х',
  'y': 'у', 'Y': 'У',
  'H': 'Н',
  'K': 'К',
  'M': 'М',
  'T': 'Т',
  'B': 'В',
};

// Canonical category names mapping (normalized → canonical)
const CATEGORY_ALIASES: Record<string, string> = {
  // Add any known variations here
  'дамски топ': 'Дамски топ',
  'дамска блуза': 'Дамска блуза',
  'дамскa блуза': 'Дамска блуза', // Latin 'a'
  'дамски панталон': 'Дамски панталон',
  'дамски пуловер': 'Дамски пуловер',
  'дамска риза': 'Дамска риза',
  'дамско сако': 'Дамско сако',
  'дамски елек': 'Дамски елек',
  'дамска рокля': 'Дамска рокля',
  'дамско яке': 'Дамско яке',
};

/**
 * Normalize text by replacing Latin lookalikes with Cyrillic
 */
function normalizeCyrillic(text: string): string {
  let result = '';
  for (const char of text) {
    result += LATIN_TO_CYRILLIC[char] || char;
  }
  return result;
}

/**
 * Normalize category name: trim, fix Latin lookalikes, map to canonical name
 */
function normalizeCategory(rawCategory: string): string {
  // 1. Trim whitespace
  let category = rawCategory.trim();
  
  // 2. Normalize multiple spaces to single space
  category = category.replace(/\s+/g, ' ');
  
  // 3. Replace Latin lookalikes with Cyrillic
  category = normalizeCyrillic(category);
  
  // 4. Check for known aliases (case-insensitive)
  const lowerCategory = category.toLowerCase();
  if (CATEGORY_ALIASES[lowerCategory]) {
    return CATEGORY_ALIASES[lowerCategory];
  }
  
  // 5. Return cleaned category (capitalize first letter)
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function slugify(text: string): string {
  // Bulgarian to Latin transliteration map
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': '',
    'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
    'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': '',
    'Ю': 'Yu', 'Я': 'Ya',
  };

  let result = '';
  for (const char of text) {
    result += translitMap[char] || char;
  }

  return result
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parsePrice(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(',', '.').replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseCSV(content: string): Product[] {
  const lines = content.split('\n').filter(line => line.trim());
  const products: Product[] = [];
  const seenSkus = new Set<string>();

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    
    const sku = columns[COL.SKU]?.trim();
    if (!sku) {
      console.warn(`Row ${i + 1}: Skipping - no SKU`);
      continue;
    }

    // Skip duplicates (use first occurrence)
    if (seenSkus.has(sku)) {
      console.warn(`Row ${i + 1}: Skipping duplicate SKU "${sku}"`);
      continue;
    }
    seenSkus.add(sku);

    const name = columns[COL.NAME]?.trim() || '';
    const rawCategory = columns[COL.CATEGORY] || '';
    const category = normalizeCategory(rawCategory);
    const composition = columns[COL.COMPOSITION]?.trim() || '';
    const color = columns[COL.COLOR]?.trim() || '';
    const retailPrice = parsePrice(columns[COL.PRICE_RETAIL]);

    const description = [
      composition,
      color ? `Цвят: ${color}` : '',
    ].filter(Boolean).join('. ');

    const prices: ProductPrice[] = [
      { type: 'wholesale_off_season', value: parsePrice(columns[COL.PRICE_WHOLESALE_OFF_SEASON]) },
      { type: 'wholesale', value: parsePrice(columns[COL.PRICE_WHOLESALE]) },
      { type: 'online_discounted', value: parsePrice(columns[COL.PRICE_ONLINE_DISCOUNTED]) },
      { type: 'retail', value: retailPrice },
      { type: 'promo_25', value: parsePrice(columns[COL.PRICE_PROMO_25]) },
    ];

    // Use normalized category for both ID (slug) and name
    const categorySlug = slugify(category);

    const product: Product = {
      id: sku,
      type: 'products',
      attributes: {
        name: name || sku,
        description,
        price: retailPrice,
        sku,
        categories: category ? [{ id: categorySlug, name: category }] : [],
        color,
        composition,
        prices,
      },
    };

    products.push(product);
  }

  return products;
}

/**
 * Extract unique categories from products
 */
function extractCategories(products: Product[]): Category[] {
  const categoriesMap = new Map<string, { name: string; productCount: number }>();
  
  for (const product of products) {
    const cat = product.attributes.categories[0];
    if (cat) {
      const existing = categoriesMap.get(cat.id);
      if (existing) {
        existing.productCount++;
      } else {
        categoriesMap.set(cat.id, { name: cat.name, productCount: 1 });
      }
    }
  }
  
  // Convert to Category array with order based on product count (most products first)
  const sortedCategories = Array.from(categoriesMap.entries())
    .sort((a, b) => b[1].productCount - a[1].productCount);
  
  return sortedCategories.map(([slug, { name }], index) => ({
    id: slug,
    type: 'categories' as const,
    attributes: {
      name,
      url_handle: slug,
      order: index + 1,
      parent_id: null,
    },
  }));
}

/**
 * Import categories to Firestore
 */
async function importCategories(categories: Category[], dryRun: boolean): Promise<void> {
  console.log(`\nFound ${categories.length} categories to import\n`);
  
  if (dryRun) {
    console.log('=== CATEGORIES (DRY RUN) ===');
    categories.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.attributes.name} (slug: ${cat.id}, order: ${cat.attributes.order})`);
    });
    console.log('');
    return;
  }
  
  const batch = db.batch();
  
  for (const category of categories) {
    const docRef = db.collection('categories').doc(category.id);
    batch.set(docRef, {
      id: category.id,
      type: category.type,
      attributes: category.attributes,
      importedAt: new Date(),
    });
  }
  
  try {
    await batch.commit();
    console.log(`Imported ${categories.length} categories`);
  } catch (error) {
    console.error('Failed to import categories:', error);
  }
}

async function importProducts(products: Product[], dryRun: boolean): Promise<void> {
  console.log(`\nFound ${products.length} products to import\n`);

  if (dryRun) {
    console.log('=== DRY RUN MODE ===\n');
    
    // Collect unique categories for summary
    const categoryStats = new Map<string, number>();
    
    products.forEach((p, i) => {
      const cat = p.attributes.categories[0];
      if (cat) {
        categoryStats.set(cat.id, (categoryStats.get(cat.id) || 0) + 1);
      }
      
      console.log(`${i + 1}. ${p.attributes.sku}`);
      console.log(`   Name: ${p.attributes.name}`);
      console.log(`   Category: ${cat?.name || 'N/A'} (slug: ${cat?.id || 'N/A'})`);
      console.log(`   Price: ${p.attributes.price} лв`);
      console.log('');
    });
    
    console.log('=== CATEGORY SUMMARY ===');
    for (const [slug, count] of categoryStats.entries()) {
      console.log(`  ${slug}: ${count} products`);
    }
    
    console.log('\n=== DRY RUN COMPLETE ===');
    console.log(`Would import ${products.length} products`);
    return;
  }

  // Batch write to Firestore
  const BATCH_SIZE = 500;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = products.slice(i, i + BATCH_SIZE);

    for (const product of chunk) {
      const docRef = db.collection('products').doc(product.id);
      batch.set(docRef, {
        id: product.id,
        type: product.type,
        attributes: product.attributes,
        importedAt: new Date(),
      });
    }

    try {
      await batch.commit();
      imported += chunk.length;
      console.log(`Imported batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} products`);
    } catch (error) {
      failed += chunk.length;
      console.error(`Failed to import batch:`, error);
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Failed: ${failed}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  // Default CSV path
  let csvPath = args.find(arg => !arg.startsWith('--')) || 'data/SS2026_2.csv';
  csvPath = resolve(__dirname, '..', csvPath);

  console.log(`Reading CSV: ${csvPath}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}\n`);

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const products = parseCSV(content);
    
    // Extract and import categories first
    const categories = extractCategories(products);
    await importCategories(categories, dryRun);
    
    // Then import products
    await importProducts(products, dryRun);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
