import Dexie, { type Table } from 'dexie';
import type { Asset, Frame } from '../types';

class AppDB extends Dexie {
  assets!: Table<Asset, string>;
  frames!: Table<Frame, string>;

  constructor() {
    // 公開後は保存済みデータを引き継ぐため、この名前は変えない
    super('demi-camera');
    this.version(1).stores({
      assets: 'id, createdAt',
      frames: 'id, updatedAt',
    });
  }
}

export const db = new AppDB();

export const newId = (): string => crypto.randomUUID();
