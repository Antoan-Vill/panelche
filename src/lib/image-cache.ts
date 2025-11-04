'use client';

type CacheListener = (imageId: string) => void;

const imageUrlCache = new Map<string, string>();
const listeners = new Set<CacheListener>();

export function getCachedImageUrl(imageId: string): string | undefined {
  return imageUrlCache.get(imageId);
}

export function setCachedImageUrl(imageId: string, url: string) {
  imageUrlCache.set(imageId, url);
  listeners.forEach((fn) => fn(imageId));
}

export function onCacheUpdate(listener: CacheListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function fetchImageEndpoint(imageId: string, signal?: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(`/api/images/${imageId}`, { signal, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchImageUrlAndCache(imageId: string, timeoutMs: number = 5000): Promise<string | null> {
  if (imageUrlCache.has(imageId)) {
    return imageUrlCache.get(imageId)!;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const data = await fetchImageEndpoint(imageId, controller.signal);
  clearTimeout(timeout);

  const url: string | null = data?.attributes?.thumbs?.["600x600"]
    || data?.attributes?.thumbs?.["300x300"]
    || data?.attributes?.src
    || null;

  if (url) {
    setCachedImageUrl(imageId, url);
  }

  return url;
}

export async function prefetchImages(
  imageIds: string[],
  concurrency: number = 3,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const queue = Array.from(new Set(imageIds)).filter((id) => !!id && !imageUrlCache.has(id));
  const total = queue.length;
  let done = 0;

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      await fetchImageUrlAndCache(id).catch(() => null);
      done += 1;
      if (onProgress) onProgress(done, total);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
  await Promise.all(workers);
}


