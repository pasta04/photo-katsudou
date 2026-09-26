import Dexie, { type Table } from 'dexie';
import type { Asset, AssetImage, Frame, FrameThumbnail } from '../types';

class AppDB extends Dexie {
  assets!: Table<Asset, string>;
  assetImages!: Table<AssetImage, string>;
  frames!: Table<Frame, string>;
  frameThumbnails!: Table<FrameThumbnail, string>;

  constructor() {
    // 公開後は保存済みデータを引き継ぐため、この名前は変えない
    super('demi-camera');
    this.version(1).stores({
      assets: 'id, createdAt',
      frames: 'id, updatedAt',
    });
    // 画像データを別のテーブルに分けた（理由は types.ts の Asset を参照）。
    // 正式公開前の変更なので、それまでのデータは引き継がずに消す
    this.version(2)
      .stores({
        assets: 'id, createdAt',
        assetImages: 'id',
        frames: 'id, updatedAt',
        frameThumbnails: 'id',
      })
      .upgrade(async (tx) => {
        await tx.table('assets').clear();
        await tx.table('frames').clear();
      });
  }
}

export const db = new AppDB();

export const newId = (): string => crypto.randomUUID();
