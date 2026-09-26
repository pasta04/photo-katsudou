import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import type { Aspect, Layer } from '../types';
import { isThemeId, type ThemeId } from './theme';

/**
 * バックアップファイル（zip）の形式。
 *
 *   backup.json      素材のメタデータ・フレーム・設定
 *   assets/<素材ID>   素材の画像そのもの
 *
 * サムネイルは読み込み時に作り直すので含めない。
 * 形式を変えるときは BACKUP_VERSION を上げ、古い形式も読めるようにすること。
 */
export const BACKUP_FORMAT = 'demi-camera-backup';
export const BACKUP_VERSION = 1;
const MANIFEST = 'backup.json';

export interface BackupAsset {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: number;
  blob: Blob;
}

export interface BackupFrame {
  id: string;
  name: string;
  aspect: Aspect;
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
}

/** バックアップに含める設定（端末固有のカメラ ID などは含めない） */
export interface BackupSettings {
  theme?: ThemeId;
  photoFormat?: 'jpeg' | 'png';
  jpegQuality?: number;
  mirrorFrontCamera?: boolean;
  showGrid?: boolean;
  timerSeconds?: number;
}

export interface BackupContents {
  appVersion: string;
  exportedAt: string;
  assets: BackupAsset[];
  frames: BackupFrame[];
  settings: BackupSettings;
}

export class BackupFormatError extends Error {}

const assetPath = (id: string) => `assets/${id}`;

export async function packBackup(contents: BackupContents): Promise<Uint8Array> {
  const manifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    appVersion: contents.appVersion,
    exportedAt: contents.exportedAt,
    assets: contents.assets.map(({ id, name, mimeType, width, height, createdAt }) => ({
      id,
      name,
      mimeType,
      width,
      height,
      createdAt,
      file: assetPath(id),
    })),
    frames: contents.frames,
    settings: contents.settings,
  };
  const files: Zippable = { [MANIFEST]: strToU8(JSON.stringify(manifest, null, 2)) };
  for (const asset of contents.assets) {
    // 画像はすでに圧縮済みなので、zip では圧縮せず格納だけする
    files[assetPath(asset.id)] = [new Uint8Array(await asset.blob.arrayBuffer()), { level: 0 }];
  }
  return zipSync(files);
}

export function unpackBackup(bytes: Uint8Array): BackupContents {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new BackupFormatError('バックアップファイル（zip）として読み込めませんでした。');
  }
  const raw = files[MANIFEST];
  if (!raw) throw new BackupFormatError('デミカメラのバックアップファイルではありません。');

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(strFromU8(raw));
  } catch {
    throw new BackupFormatError('バックアップファイルの中身が壊れています。');
  }
  if (manifest.format !== BACKUP_FORMAT) {
    throw new BackupFormatError('デミカメラのバックアップファイルではありません。');
  }
  if (typeof manifest.version !== 'number' || manifest.version > BACKUP_VERSION) {
    throw new BackupFormatError(
      'このバックアップは新しいバージョンのアプリで作られています。アプリを更新してから読み込んでください。',
    );
  }
  if (!Array.isArray(manifest.assets) || !Array.isArray(manifest.frames)) {
    throw new BackupFormatError('バックアップファイルの中身が壊れています。');
  }

  const assets: BackupAsset[] = manifest.assets.map((a: Record<string, unknown>) => {
    const data = typeof a.file === 'string' ? files[a.file] : undefined;
    if (typeof a.id !== 'string' || typeof a.mimeType !== 'string' || !data) {
      throw new BackupFormatError('バックアップファイルに含まれる画像が見つかりません。');
    }
    return {
      id: a.id,
      name: typeof a.name === 'string' ? a.name : '素材',
      mimeType: a.mimeType,
      width: Number(a.width),
      height: Number(a.height),
      createdAt: Number(a.createdAt) || Date.now(),
      blob: new Blob([data as BlobPart], { type: a.mimeType }),
    };
  });

  const assetIds = new Set(assets.map((a) => a.id));
  const frames: BackupFrame[] = manifest.frames.map((f: Record<string, unknown>) => {
    const aspect = f.aspect as Aspect | undefined;
    if (
      typeof f.id !== 'string' ||
      !aspect ||
      !(aspect.w > 0) ||
      !(aspect.h > 0) ||
      !Array.isArray(f.layers)
    ) {
      throw new BackupFormatError('バックアップファイルのフレーム情報が壊れています。');
    }
    return {
      id: f.id,
      name: typeof f.name === 'string' ? f.name : 'フレーム',
      aspect: { w: aspect.w, h: aspect.h },
      // 素材が含まれていないレイヤーは表示できないので取り除く
      layers: (f.layers as Layer[]).filter((l) => assetIds.has(l.assetId)),
      createdAt: Number(f.createdAt) || Date.now(),
      updatedAt: Number(f.updatedAt) || Date.now(),
    };
  });

  return {
    appVersion: String(manifest.appVersion ?? ''),
    exportedAt: String(manifest.exportedAt ?? ''),
    assets,
    frames,
    settings: pickSettings(manifest.settings),
  };
}

/** 設定は知っている項目のうち、型が合うものだけ取り込む */
function pickSettings(raw: unknown): BackupSettings {
  const s = (raw ?? {}) as Record<string, unknown>;
  const out: BackupSettings = {};
  if (isThemeId(s.theme)) out.theme = s.theme;
  if (s.photoFormat === 'jpeg' || s.photoFormat === 'png') out.photoFormat = s.photoFormat;
  if (typeof s.jpegQuality === 'number' && s.jpegQuality > 0 && s.jpegQuality <= 1) {
    out.jpegQuality = s.jpegQuality;
  }
  if (typeof s.mirrorFrontCamera === 'boolean') out.mirrorFrontCamera = s.mirrorFrontCamera;
  if (typeof s.showGrid === 'boolean') out.showGrid = s.showGrid;
  if (typeof s.timerSeconds === 'number' && s.timerSeconds >= 0) out.timerSeconds = s.timerSeconds;
  return out;
}
