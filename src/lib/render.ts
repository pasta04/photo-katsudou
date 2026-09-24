import type { Aspect, Layer } from '../types';
import { coverCrop, layerBox } from './layout';

/** 出力画像の長辺の上限（px） */
export const MAX_OUTPUT_SIZE = 4096;

/**
 * フレームのレイヤーを ctx に描く。描画先は (0,0)-(width,height) がフレーム全体。
 * 編集画面のサムネイル・カメラのプレビュー・撮影時の合成で共通に使う。
 */
export function drawLayers(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  layers: Layer[],
  images: ReadonlyMap<string, HTMLImageElement>,
  width: number,
  height: number,
): void {
  for (const layer of layers) {
    if (!layer.visible) continue;
    const img = images.get(layer.assetId);
    if (!img) continue;
    const box = layerBox(
      layer,
      { width: img.naturalWidth, height: img.naturalHeight },
      width,
      height,
    );
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(box.cx, box.cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
    ctx.drawImage(img, -box.width / 2, -box.height / 2, box.width, box.height);
    ctx.restore();
  }
}

export interface ComposeOptions {
  video: HTMLVideoElement;
  aspect: Aspect;
  layers: Layer[];
  images: ReadonlyMap<string, HTMLImageElement>;
  /** カメラ映像を左右反転して保存するか（フレームは反転しない） */
  mirror: boolean;
}

/** カメラ映像をフレーム比率で切り抜き、フレームを重ねた canvas を返す */
export function composePhoto({
  video,
  aspect,
  layers,
  images,
  mirror,
}: ComposeOptions): HTMLCanvasElement {
  const crop = coverCrop(video.videoWidth, video.videoHeight, aspect);
  const scale = Math.min(1, MAX_OUTPUT_SIZE / Math.max(crop.width, crop.height));
  const width = Math.round(crop.width * scale);
  const height = Math.round(crop.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas を初期化できませんでした');

  ctx.save();
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  ctx.restore();

  drawLayers(ctx, layers, images, width, height);
  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画像の生成に失敗しました'))),
      type,
      quality,
    );
  });
}

/** フレームのサムネイル（長辺 size px、透過 PNG） */
export async function renderFrameThumbnail(
  aspect: Aspect,
  layers: Layer[],
  images: ReadonlyMap<string, HTMLImageElement>,
  size = 320,
): Promise<Blob> {
  const scale = size / Math.max(aspect.w, aspect.h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(aspect.w * scale));
  canvas.height = Math.max(1, Math.round(aspect.h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas を初期化できませんでした');
  drawLayers(ctx, layers, images, canvas.width, canvas.height);
  return canvasToBlob(canvas, 'image/png');
}
