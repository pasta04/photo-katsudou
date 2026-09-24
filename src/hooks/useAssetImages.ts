import { useEffect, useState } from 'react';
import { loadAssetImages } from '../db/imageCache';
import type { Layer } from '../types';

const EMPTY = new Map<string, HTMLImageElement>();

/** レイヤーが参照する素材画像を読み込む */
export function useAssetImages(layers: Layer[] | undefined): ReadonlyMap<string, HTMLImageElement> {
  const [images, setImages] = useState<ReadonlyMap<string, HTMLImageElement>>(EMPTY);
  // 素材の組み合わせが変わったときだけ読み込み直す
  const key = [...new Set(layers?.map((l) => l.assetId) ?? [])].sort().join(',');

  useEffect(() => {
    let cancelled = false;
    loadAssetImages(key ? key.split(',') : []).then((map) => {
      if (!cancelled) setImages(map);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return images;
}
