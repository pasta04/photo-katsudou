import { canvasToBlob } from '../lib/render';
import type { Asset } from '../types';
import { db, newId } from './db';
import { forgetImage } from './imageCache';

/** 素材の長辺の上限（px）。端末のストレージとメモリを圧迫しないよう取り込み時に縮小する */
export const MAX_ASSET_SIZE = 4096;
const THUMBNAIL_SIZE = 256;
const KEEP_AS_IS = ['image/png', 'image/webp', 'image/jpeg'];

export class UnsupportedImageError extends Error {}

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new UnsupportedImageError(
      'この画像形式は読み込めませんでした。PNG / JPEG / WebP で保存し直してください。',
    );
  }
}

function resized(bitmap: ImageBitmap, maxSize: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** 画像ファイルを素材として登録する。大きすぎる画像は縮小し、透過は保持する */
export async function importAsset(file: File): Promise<Asset> {
  const bitmap = await decode(file);
  try {
    let blob: Blob = file;
    let width = bitmap.width;
    let height = bitmap.height;

    if (Math.max(width, height) > MAX_ASSET_SIZE || !KEEP_AS_IS.includes(file.type)) {
      const canvas = resized(bitmap, MAX_ASSET_SIZE);
      // JPEG 以外は透過を持ちうるので PNG で保存し直す
      blob =
        file.type === 'image/jpeg'
          ? await canvasToBlob(canvas, 'image/jpeg', 0.95)
          : await canvasToBlob(canvas, 'image/png');
      width = canvas.width;
      height = canvas.height;
    }

    const thumbnail = await canvasToBlob(resized(bitmap, THUMBNAIL_SIZE), 'image/png');
    const asset: Asset = {
      id: newId(),
      name: file.name.replace(/\.[^.]+$/, '') || '素材',
      blob,
      mimeType: blob.type,
      width,
      height,
      thumbnail,
      createdAt: Date.now(),
    };
    await db.assets.add(asset);
    return asset;
  } finally {
    bitmap.close();
  }
}

/** この素材を使っているフレーム名の一覧 */
export async function framesUsingAsset(assetId: string): Promise<string[]> {
  const frames = await db.frames.toArray();
  return frames.filter((f) => f.layers.some((l) => l.assetId === assetId)).map((f) => f.name);
}

/** 素材を削除する。使っているフレームからはそのレイヤーも取り除く */
export async function deleteAsset(assetId: string): Promise<void> {
  await db.transaction('rw', db.assets, db.frames, async () => {
    await db.assets.delete(assetId);
    const frames = await db.frames.toArray();
    for (const frame of frames) {
      if (frame.layers.some((l) => l.assetId === assetId)) {
        await db.frames.update(frame.id, {
          layers: frame.layers.filter((l) => l.assetId !== assetId),
          updatedAt: Date.now(),
        });
      }
    }
  });
  forgetImage(assetId);
}

export async function renameAsset(assetId: string, name: string): Promise<void> {
  await db.assets.update(assetId, { name });
}
