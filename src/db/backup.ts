import { APP_VERSION } from '../lib/appInfo';
import {
  type BackupContents,
  type BackupSettings,
  packBackup,
  unpackBackup,
} from '../lib/backupFormat';
import { fileTimestamp } from '../lib/fileName';
import { renderFrameThumbnail } from '../lib/render';
import { useSettings } from '../store/settings';
import type { Asset, AssetImage, Frame, FrameThumbnail } from '../types';
import { makeAssetThumbnail } from './assets';
import { db } from './db';
import { forgetImage } from './imageCache';

export { BackupFormatError } from '../lib/backupFormat';
export type { BackupContents } from '../lib/backupFormat';

/** 素材・フレーム・撮影設定を 1 つの zip ファイルに書き出す */
export async function exportBackup(): Promise<File> {
  const [assets, images, frames] = await Promise.all([
    db.assets.toArray(),
    db.assetImages.toArray(),
    db.frames.toArray(),
  ]);
  const blobs = new Map(images.map((i) => [i.id, i.blob]));
  const s = useSettings.getState();
  const settings: BackupSettings = {
    theme: s.theme,
    photoFormat: s.photoFormat,
    jpegQuality: s.jpegQuality,
    showGrid: s.showGrid,
    timerSeconds: s.timerSeconds,
  };
  const bytes = await packBackup({
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    // 画像データのない素材は表示も撮影もできないので書き出さない
    assets: assets.flatMap(({ id, name, mimeType, width, height, createdAt }) => {
      const blob = blobs.get(id);
      return blob ? [{ id, name, mimeType, width, height, createdAt, blob }] : [];
    }),
    frames: frames.map(({ id, name, aspect, layers, createdAt, updatedAt }) => ({
      id,
      name,
      aspect,
      layers,
      createdAt,
      updatedAt,
    })),
    settings,
  });
  return new File([bytes as BlobPart], `demi-camera-backup_${fileTimestamp()}.zip`, {
    type: 'application/zip',
  });
}

/** バックアップファイルを読み込んで中身を確認する（まだ保存はしない） */
export async function readBackup(file: File): Promise<BackupContents> {
  return unpackBackup(new Uint8Array(await file.arrayBuffer()));
}

/** 今の素材・フレームをすべて削除し、バックアップの内容に置き換える */
export async function importBackup(contents: BackupContents): Promise<void> {
  // サムネイルを先に作っておき、保存は 1 回のトランザクションで行う（途中で失敗しても中途半端に残らない）
  const assets: Asset[] = [];
  const assetImages: AssetImage[] = [];
  for (const { blob, ...asset } of contents.assets) {
    assets.push(asset);
    assetImages.push({ id: asset.id, blob, thumbnail: await makeAssetThumbnail(blob) });
  }
  const frames: Frame[] = contents.frames;
  const images = await loadImages(contents.assets);
  let frameThumbnails: FrameThumbnail[];
  try {
    frameThumbnails = await Promise.all(
      frames.map(async (f) => ({
        id: f.id,
        blob: await renderFrameThumbnail(f.aspect, f.layers, images.map),
      })),
    );
  } finally {
    images.release();
  }

  const replacedIds = await db.assets.toCollection().primaryKeys();

  const tables = [db.assets, db.assetImages, db.frames, db.frameThumbnails];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await db.assets.bulkPut(assets);
    await db.assetImages.bulkPut(assetImages);
    await db.frames.bulkPut(frames);
    await db.frameThumbnails.bulkPut(frameThumbnails);
  });

  // 画面で使っている読み込み済みの画像を捨て、次に表示するときに読み直させる
  for (const id of new Set([...replacedIds, ...assets.map((a) => a.id)])) forgetImage(id);

  useSettings.getState().set({ ...contents.settings, lastFrameId: null });
}

/** フレームのサムネイル作成用に、バックアップ内の画像を読み込む */
async function loadImages(assets: BackupContents['assets']) {
  const urls: string[] = [];
  const map = new Map<string, HTMLImageElement>();
  await Promise.all(
    assets.map(async (a) => {
      const url = URL.createObjectURL(a.blob);
      urls.push(url);
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
        map.set(a.id, img);
      } catch {
        // 読めない画像はサムネイルに描かないだけにする（素材の取り込み時にエラーになる）
      }
    }),
  );
  return { map, release: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
}
