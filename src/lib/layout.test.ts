import { describe, expect, it } from 'vitest';
import type { Layer } from '../types';
import { containRect, coverCrop, fitWidth, formatAspect, layerBox, sameAspect } from './layout';

const layer = (patch: Partial<Layer> = {}): Layer => ({
  id: 'l',
  assetId: 'a',
  cx: 0.5,
  cy: 0.5,
  width: 1,
  rotation: 0,
  opacity: 1,
  flipX: false,
  flipY: false,
  visible: true,
  locked: false,
  ...patch,
});

describe('containRect', () => {
  it('縦長フレームを横長の領域に収めると左右に余白が出る', () => {
    expect(containRect(1600, 900, { w: 3, h: 4 })).toEqual({
      x: (1600 - 675) / 2,
      y: 0,
      width: 675,
      height: 900,
    });
  });

  it('横長フレームを縦長の領域に収めると上下に余白が出る', () => {
    expect(containRect(900, 1600, { w: 16, h: 9 })).toEqual({
      x: 0,
      y: (1600 - 506.25) / 2,
      width: 900,
      height: 506.25,
    });
  });
});

describe('coverCrop', () => {
  it('横長の映像から縦長フレームの比率で中央を切り抜く', () => {
    expect(coverCrop(1920, 1080, { w: 3, h: 4 })).toEqual({
      x: (1920 - 810) / 2,
      y: 0,
      width: 810,
      height: 1080,
    });
  });

  it('縦長の映像から横長フレームの比率で中央を切り抜く', () => {
    expect(coverCrop(1080, 1920, { w: 16, h: 9 })).toEqual({
      x: 0,
      y: (1920 - 607.5) / 2,
      width: 1080,
      height: 607.5,
    });
  });

  it('切り抜いた矩形はフレームと同じ比率になる', () => {
    const r = coverCrop(4032, 3024, { w: 811, h: 1182 });
    expect(r.width / r.height).toBeCloseTo(811 / 1182);
  });
});

describe('layerBox', () => {
  it('高さは素材の縦横比から導出され、描画先の解像度が変わっても素材は歪まない', () => {
    const asset = { width: 400, height: 200 };
    const l = layer({ cx: 0.25, cy: 0.75, width: 0.5 });
    const small = layerBox(l, asset, 300, 400);
    const large = layerBox(l, asset, 3000, 4000);
    expect(small).toEqual({ cx: 75, cy: 300, width: 150, height: 75 });
    expect(large).toEqual({ cx: 750, cy: 3000, width: 1500, height: 750 });
    expect(small.width / small.height).toBe(asset.width / asset.height);
  });
});

describe('fitWidth', () => {
  it('フレームと同じ比率の素材はちょうど全面になる', () => {
    expect(fitWidth({ width: 811, height: 1182 }, { w: 811, h: 1182 })).toBeCloseTo(1);
  });

  it('フレームより縦長の素材は高さで制限される', () => {
    // 1:2 の素材を 1:1 のフレームに収めると幅は半分
    expect(fitWidth({ width: 100, height: 200 }, { w: 1, h: 1 })).toBe(0.5);
  });

  it('フレームより横長の素材は幅いっぱい', () => {
    expect(fitWidth({ width: 300, height: 100 }, { w: 1, h: 1 })).toBe(1);
  });
});

describe('sameAspect / formatAspect', () => {
  it('ほぼ同じ比率を同一とみなす', () => {
    expect(sameAspect({ w: 1080, h: 1920 }, { w: 9, h: 16 })).toBe(true);
    expect(sameAspect({ w: 3, h: 4 }, { w: 9, h: 16 })).toBe(false);
  });

  it('整数比にできるものは簡約して表示する', () => {
    expect(formatAspect({ w: 1080, h: 1920 })).toBe('9:16');
    expect(formatAspect({ w: 811, h: 1182 })).toBe('811×1182');
  });
});
