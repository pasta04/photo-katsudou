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
import type { Asset, Frame } from '../types';
import { makeAssetThumbnail } from './assets';
import { db } from './db';
import { forgetImage } from './imageCache';

export { BackupFormatError } from '../lib/backupFormat';
export type { BackupContents } from '../lib/backupFormat';

/** 素材・フレーム・撮影設定を 1 つの zip ファイルに書き出す */
export async function exportBackup(): Promise<File> {
  const [assets, frames] = await Promise.all([db.assets.toArray(), db.frames.toArray()]);
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
    assets: assets.map(({ id, name, mimeType, width, height, createdAt, blob }) => ({
      id,
      name,
      mimeType,
      width,
      height,
      createdAt,
      blob,
    })),
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
  for (const a of contents.assets) {
    assets.push({ ...a, thumbnail: await makeAssetThumbnail(a.blob) });
  }
  const images = await loadImages(contents.assets);
  let frames: Frame[];
  try {
    frames = await Promise.all(
      contents.frames.map(async (f) => ({
        ...f,
        thumbnail: await renderFrameThumbnail(f.aspect, f.layers, images.map),
      })),
    );
  } finally {
    images.release();
  }

  const replacedIds = await db.assets.toCollection().primaryKeys();

  await db.transaction('rw', db.assets, db.frames, async () => {
    await db.assets.clear();
    await db.frames.clear();
    await db.assets.bulkPut(assets);
    await db.frames.bulkPut(frames);
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
