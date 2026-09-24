import type { Aspect, Layer } from '../types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 素材の縦横情報。Asset そのものや読み込み済み画像の寸法を渡す */
export interface Dimensions {
  width: number;
  height: number;
}

/** container 内に aspect の矩形を最大サイズで収めたときの矩形（中央寄せ） */
export function containRect(containerW: number, containerH: number, aspect: Aspect): Rect {
  const ratio = aspect.w / aspect.h;
  let width = containerW;
  let height = width / ratio;
  if (height > containerH) {
    height = containerH;
    width = height * ratio;
  }
  return { x: (containerW - width) / 2, y: (containerH - height) / 2, width, height };
}

/**
 * 映像（srcW×srcH）から aspect の比率で中央を切り抜く矩形（映像の px 座標）。
 * CSS の object-fit: cover と同じ切り抜き方。
 */
export function coverCrop(srcW: number, srcH: number, aspect: Aspect): Rect {
  const ratio = aspect.w / aspect.h;
  if (srcW / srcH > ratio) {
    const width = srcH * ratio;
    return { x: (srcW - width) / 2, y: 0, width, height: srcH };
  }
  const height = srcW / ratio;
  return { x: 0, y: (srcH - height) / 2, width: srcW, height };
}

/** レイヤーの実寸（px）。回転前の中心座標と幅・高さ */
export interface LayerBox {
  cx: number;
  cy: number;
  width: number;
  height: number;
}

/** 割合で持っているレイヤーを、frameW×frameH px の描画先での px に変換する */
export function layerBox(
  layer: Layer,
  asset: Dimensions,
  frameW: number,
  frameH: number,
): LayerBox {
  const width = layer.width * frameW;
  return {
    cx: layer.cx * frameW,
    cy: layer.cy * frameH,
    width,
    height: (width * asset.height) / asset.width,
  };
}

/** 素材がフレームからはみ出さない最大の幅（フレーム幅に対する割合） */
export function fitWidth(asset: Dimensions, aspect: Aspect): number {
  // レイヤーの高さ(px) = width * frameW * asset.h / asset.w <= frameH
  const limit = (aspect.h * asset.width) / (aspect.w * asset.height);
  return Math.min(1, limit);
}

/** 2 つの比率がほぼ同じか（素材の比率とフレームの比率の一致判定用） */
export function sameAspect(a: Aspect, b: Aspect, tolerance = 0.01): boolean {
  const ra = a.w / a.h;
  const rb = b.w / b.h;
  return Math.abs(ra - rb) / rb < tolerance;
}

export function isPortrait(aspect: Aspect): boolean {
  return aspect.w < aspect.h;
}

/** 表示用に比率を簡単な整数比にする（例: 1080x1920 → 9:16）。割り切れなければ px のまま */
export function formatAspect(aspect: Aspect): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const w = Math.round(aspect.w);
  const h = Math.round(aspect.h);
  const g = gcd(w, h) || 1;
  const sw = w / g;
  const sh = h / g;
  if (sw <= 32 && sh <= 32) return `${sw}:${sh}`;
  return `${w}×${h}`;
}
