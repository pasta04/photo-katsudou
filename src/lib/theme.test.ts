import { describe, expect, it } from 'vitest';
import { getTheme, isThemeId, patternUrl, THEME_IDS, THEMES } from './theme';

describe('theme', () => {
  it('4 つのテーマがそれぞれ別のマークを持つ', () => {
    const suits = THEME_IDS.map((id) => THEMES[id].suit);
    expect(new Set(suits).size).toBe(4);
  });

  it('知らない値は既定のテーマ（Cute）になる', () => {
    expect(isThemeId('pop')).toBe(true);
    expect(isThemeId('dark')).toBe(false);
    expect(getTheme('dark').id).toBe('cute');
    expect(getTheme(undefined).id).toBe('cute');
  });

  it('模様はキャラクターカラーで塗った SVG の data URL', () => {
    const url = patternUrl(THEMES.cool);
    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(url)).toContain('fill="#5b6f97"');
  });
});
