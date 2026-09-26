import { db } from './db';

interface Entry {
  url?: string;
  promise: Promise<HTMLImageElement>;
}

/**
 * 素材 ID → 読み込み済み <img> のキャッシュ。
 * 同じ素材を編集画面とカメラ画面で使い回すため、アプリ全体で共有する。
 */
const cache = new Map<string, Entry>();

async function load(assetId: string, entry: Entry): Promise<HTMLImageElement> {
  const image = await db.assetImages.get(assetId);
  if (!image) throw new Error(`素材が見つかりません: ${assetId}`);
  entry.url = URL.createObjectURL(image.blob);
  const img = new Image();
  img.src = entry.url;
  await img.decode();
  return img;
}

export function loadAssetImage(assetId: string): Promise<HTMLImageElement> {
  const hit = cache.get(assetId);
  if (hit) return hit.promise;

  const entry = {} as Entry;
  entry.promise = load(assetId, entry);
  cache.set(assetId, entry);
  // 失敗したものはキャッシュしない（次回再試行できるように）
  entry.promise.catch(() => forgetImage(assetId));
  return entry.promise;
}

export function forgetImage(assetId: string): void {
  const hit = cache.get(assetId);
  if (!hit) return;
  if (hit.url) URL.revokeObjectURL(hit.url);
  cache.delete(assetId);
}

/** 複数の素材をまとめて読み込む。読み込めなかった素材は結果に含めない */
export async function loadAssetImages(
  assetIds: Iterable<string>,
): Promise<Map<string, HTMLImageElement>> {
  const ids = [...new Set(assetIds)];
  const results = await Promise.allSettled(ids.map(loadAssetImage));
  const map = new Map<string, HTMLImageElement>();
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map.set(ids[i], r.value);
  });
  return map;
}
