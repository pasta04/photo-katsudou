import { strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { Layer } from '../types';
import { type BackupContents, BackupFormatError, packBackup, unpackBackup } from './backupFormat';

const layer = (assetId: string): Layer => ({
  id: `l-${assetId}`,
  assetId,
  cx: 0.5,
  cy: 0.5,
  width: 1,
  rotation: 0,
  opacity: 1,
  flipX: false,
  flipY: false,
  visible: true,
  locked: false,
});

const sample = (): BackupContents => ({
  appVersion: '0.1.3',
  exportedAt: '2026-09-25T00:00:00.000Z',
  assets: [
    {
      id: 'a1',
      name: 'フレーム画像',
      mimeType: 'image/png',
      width: 811,
      height: 1182,
      createdAt: 1,
      blob: new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: 'image/png' }),
    },
  ],
  frames: [
    {
      id: 'f1',
      name: 'カード',
      aspect: { w: 811, h: 1182 },
      layers: [layer('a1')],
      createdAt: 1,
      updatedAt: 2,
    },
  ],
  settings: { photoFormat: 'png', timerSeconds: 3 },
});

describe('packBackup / unpackBackup', () => {
  it('書き出した内容をそのまま読み戻せる', async () => {
    const original = sample();
    const restored = unpackBackup(await packBackup(original));

    expect(restored.appVersion).toBe('0.1.3');
    expect(restored.frames).toEqual(original.frames);
    expect(restored.settings).toEqual(original.settings);
    expect(restored.assets).toHaveLength(1);
    const { blob, ...meta } = restored.assets[0];
    const { blob: originalBlob, ...originalMeta } = original.assets[0];
    expect(meta).toEqual(originalMeta);
    expect(blob.type).toBe('image/png');
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
      new Uint8Array(await originalBlob.arrayBuffer()),
    );
  });

  it('zip でないファイルはエラーになる', () => {
    expect(() => unpackBackup(strToU8('not a zip'))).toThrow(BackupFormatError);
  });

  it('デミカメラのバックアップでない zip はエラーになる', () => {
    const other = zipSync({ 'backup.json': strToU8(JSON.stringify({ format: 'other' })) });
    expect(() => unpackBackup(other)).toThrow('デミカメラのバックアップファイルではありません');
    expect(() => unpackBackup(zipSync({ 'readme.txt': strToU8('hi') }))).toThrow(BackupFormatError);
  });

  it('新しい形式のバックアップはエラーになる', () => {
    const newer = zipSync({
      'backup.json': strToU8(
        JSON.stringify({ format: 'demi-camera-backup', version: 99, assets: [], frames: [] }),
      ),
    });
    expect(() => unpackBackup(newer)).toThrow('新しいバージョン');
  });

  it('画像が欠けているとエラーになる', async () => {
    const entries = unzipSync(await packBackup(sample()));
    delete entries['assets/a1'];
    expect(() => unpackBackup(zipSync(entries))).toThrow('画像が見つかりません');
  });

  it('設定は知っている項目のうち型の合うものだけ取り込む', async () => {
    const contents = sample();
    contents.settings = {
      photoFormat: 'gif',
      jpegQuality: 5,
      showGrid: true,
      extra: 1,
    } as unknown as BackupContents['settings'];
    const restored = unpackBackup(await packBackup(contents));
    expect(restored.settings).toEqual({ showGrid: true });
  });

  it('含まれていない素材を参照するレイヤーは取り除く', async () => {
    const contents = sample();
    contents.frames[0].layers.push(layer('missing'));
    const restored = unpackBackup(await packBackup(contents));
    expect(restored.frames[0].layers.map((l) => l.assetId)).toEqual(['a1']);
  });
});
