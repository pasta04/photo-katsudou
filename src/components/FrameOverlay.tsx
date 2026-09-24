import { useEffect, useRef } from 'react';
import { drawLayers } from '../lib/render';
import type { Layer } from '../types';

interface Props {
  layers: Layer[];
  images: ReadonlyMap<string, HTMLImageElement>;
  width: number;
  height: number;
}

/** カメラ映像の上に重ねるフレーム。保存時の合成と同じ描画関数を使う */
export function FrameOverlay({ layers, images, width, height }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLayers(ctx, layers, images, canvas.width, canvas.height);
  }, [layers, images, width, height]);

  return <canvas ref={ref} className="frame-overlay" />;
}
