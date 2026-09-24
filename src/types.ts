/** 利用者が登録した画像素材 */
export interface Asset {
  id: string;
  name: string;
  /** 取り込み時に長辺 MAX_ASSET_SIZE 以下へ縮小済み。PNG/WebP は透過を保持 */
  blob: Blob;
  mimeType: string;
  /** px（縮小後） */
  width: number;
  height: number;
  /** 一覧表示用の小さな画像 */
  thumbnail: Blob;
  createdAt: number;
}

/** フレームの縦横比。{w: 3, h: 4} のような比でも、素材の px サイズそのままでもよい */
export interface Aspect {
  w: number;
  h: number;
}

/**
 * フレーム上に置いた素材 1 枚分。
 * 座標・サイズはすべてフレームに対する割合（0〜1）で持つ。
 * 高さは持たず、素材の縦横比から導出する（素材が歪まないようにするため）。
 */
export interface Layer {
  id: string;
  assetId: string;
  /** 中心 X（フレーム幅に対する割合） */
  cx: number;
  /** 中心 Y（フレーム高さに対する割合） */
  cy: number;
  /** 幅（フレーム幅に対する割合） */
  width: number;
  /** 度 */
  rotation: number;
  /** 0〜1 */
  opacity: number;
  flipX: boolean;
  flipY: boolean;
  visible: boolean;
  locked: boolean;
}

export interface Frame {
  id: string;
  name: string;
  aspect: Aspect;
  /** 先頭が最背面 */
  layers: Layer[];
  thumbnail?: Blob;
  createdAt: number;
  updatedAt: number;
}
