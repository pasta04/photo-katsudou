import { fitWidth } from '../lib/layout';
import { renderFrameThumbnail } from '../lib/render';
import type { Asset, Aspect, Frame, Layer } from '../types';
import { db, newId } from './db';
import { loadAssetImages } from './imageCache';

export function newLayer(asset: Asset, aspect: Aspect, patch: Partial<Layer> = {}): Layer {
  return {
    id: newId(),
    assetId: asset.id,
    cx: 0.5,
    cy: 0.5,
    width: Math.min(0.5, fitWidth(asset, aspect)),
    rotation: 0,
    opacity: 1,
    flipX: false,
    flipY: false,
    visible: true,
    locked: false,
    ...patch,
  };
}

/**
 * フレームを新規作成する。baseAsset を渡すと、その素材を全面に敷いた状態で作る
 * （完成済みのフレーム画像を 1 枚使う場合）。
 */
export async function createFrame(name: string, aspect: Aspect, baseAsset?: Asset): Promise<Frame> {
  const now = Date.now();
  const layers = baseAsset
    ? [newLayer(baseAsset, aspect, { width: fitWidth(baseAsset, aspect) })]
    : [];
  const frame: Frame = { id: newId(), name, aspect, layers, createdAt: now, updatedAt: now };
  const thumbnail = await thumbnailFor(frame);
  await db.transaction('rw', db.frames, db.frameThumbnails, async () => {
    await db.frames.add(frame);
    await db.frameThumbnails.add({ id: frame.id, blob: thumbnail });
  });
  return frame;
}

async function thumbnailFor(frame: Pick<Frame, 'aspect' | 'layers'>): Promise<Blob> {
  const images = await loadAssetImages(frame.layers.map((l) => l.assetId));
  return renderFrameThumbnail(frame.aspect, frame.layers, images);
}

/** 編集内容を保存する（サムネイルも作り直す） */
export async function saveFrame(frame: Frame): Promise<void> {
  // サムネイルは新しく作った Blob で置き換える（IndexedDB から読んだ Blob は書き戻さない）
  const thumbnail = await thumbnailFor(frame);
  await db.transaction('rw', db.frames, db.frameThumbnails, async () => {
    await db.frames.put({ ...frame, updatedAt: Date.now() });
    await db.frameThumbnails.put({ id: frame.id, blob: thumbnail });
  });
}

export async function duplicateFrame(frameId: string): Promise<void> {
  const frame = await db.frames.get(frameId);
  if (!frame) return;
  const now = Date.now();
  const copy: Frame = {
    ...frame,
    id: newId(),
    name: `${frame.name} のコピー`,
    layers: frame.layers.map((l) => ({ ...l, id: newId() })),
    createdAt: now,
    updatedAt: now,
  };
  const thumbnail = await thumbnailFor(copy);
  await db.transaction('rw', db.frames, db.frameThumbnails, async () => {
    await db.frames.add(copy);
    await db.frameThumbnails.add({ id: copy.id, blob: thumbnail });
  });
}

export async function renameFrame(frameId: string, name: string): Promise<void> {
  await db.frames.update(frameId, { name, updatedAt: Date.now() });
}

export async function deleteFrame(frameId: string): Promise<void> {
  await db.transaction('rw', db.frames, db.frameThumbnails, async () => {
    await db.frames.delete(frameId);
    await db.frameThumbnails.delete(frameId);
  });
}
