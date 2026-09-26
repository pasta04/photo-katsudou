/**
 * 表示テーマ。アイカツアカデミー！のアイドルのタイプに合わせた 4 種類。
 *
 *   Cute  姫乃みえる   ピンク  ハート
 *   Cool  真未夢メエ   青      ダイヤ
 *   Sexy  凛堂たいむ   紫      スペード
 *   Pop   和央パリン   黄色    クローバー
 *
 * 色は CSS 変数として :root に設定する（styles.css の var(--…) で参照）。
 * カメラ・撮影プレビュー・編集キャンバスは写真の見え方を優先して暗いまま。
 */

export const THEME_IDS = ['cute', 'cool', 'sexy', 'pop'] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME: ThemeId = 'cute';

export type Suit = 'heart' | 'diamond' | 'spade' | 'club';

export interface Theme {
  id: ThemeId;
  label: string;
  suit: Suit;
  /** 公式サイトのキャラクターカラー。背景の模様に使う */
  character: string;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    /** 文字色 */
    text: string;
    muted: string;
    accent: string;
    /** accent の上に載せる文字色 */
    accentText: string;
    /** ホームの「カメラで撮影」カードのグラデーション */
    hero: [string, string];
    heroText: string;
    danger: string;
  };
}

export const THEMES: Record<ThemeId, Theme> = {
  cute: {
    id: 'cute',
    label: 'Cute',
    suit: 'heart',
    character: '#f097a7',
    colors: {
      bg: '#fff4f6',
      surface: '#ffffff',
      surface2: '#ffe6ec',
      border: '#f5c3cf',
      text: '#6e2a3d',
      muted: '#a86d7d',
      accent: '#e2607f',
      accentText: '#ffffff',
      hero: ['#f7a9b9', '#e2607f'],
      heroText: '#ffffff',
      danger: '#d23b4b',
    },
  },
  cool: {
    id: 'cool',
    label: 'Cool',
    suit: 'diamond',
    character: '#5b6f97',
    colors: {
      bg: '#f1f4fa',
      surface: '#ffffff',
      surface2: '#e2e8f4',
      border: '#c2cce2',
      text: '#1f2d5a',
      muted: '#63709a',
      accent: '#3f5a9e',
      accentText: '#ffffff',
      hero: ['#7d92c2', '#2e438a'],
      heroText: '#ffffff',
      danger: '#c8384a',
    },
  },
  sexy: {
    id: 'sexy',
    label: 'Sexy',
    suit: 'spade',
    character: '#a28ec1',
    colors: {
      bg: '#f7f3fc',
      surface: '#ffffff',
      surface2: '#ece4f7',
      border: '#d5c8ea',
      text: '#3c2859',
      muted: '#7d6b98',
      accent: '#8566b5',
      accentText: '#ffffff',
      hero: ['#bba8d9', '#6c4ba1'],
      heroText: '#ffffff',
      danger: '#c83a5a',
    },
  },
  pop: {
    id: 'pop',
    label: 'Pop',
    suit: 'club',
    character: '#fcd005',
    colors: {
      bg: '#fffae3',
      surface: '#ffffff',
      surface2: '#fff1b8',
      border: '#f0d875',
      text: '#5b4300',
      muted: '#8e7632',
      accent: '#fcd005',
      accentText: '#4a3600',
      hero: ['#ffe45c', '#f8b800'],
      heroText: '#4a3600',
      danger: '#c8412e',
    },
  },
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function getTheme(id: string | null | undefined): Theme {
  return isThemeId(id) ? THEMES[id] : THEMES[DEFAULT_THEME];
}

/** トランプのマーク（24×24 の座標系） */
const SUIT_SHAPES: Record<Suit, string> = {
  heart:
    '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/>',
  diamond: '<path d="M12 1.5 19.5 12 12 22.5 4.5 12z"/>',
  spade:
    '<path d="M12 1.5S2.5 8.6 2.5 14a4.6 4.6 0 0 0 8.1 3c-.3 2-1.2 3.6-2.8 5h8.4c-1.6-1.4-2.5-3-2.8-5a4.6 4.6 0 0 0 8.1-3c0-5.4-9.5-12.5-9.5-12.5z"/>',
  club: '<circle cx="12" cy="6.8" r="4.3"/><circle cx="6.8" cy="13.6" r="4.3"/><circle cx="17.2" cy="13.6" r="4.3"/><circle cx="12" cy="12" r="2.6"/><path d="M12 12c0 4-1 7.6-3.6 10.5h7.2C13 19.6 12 16 12 12z"/>',
};

/** 背景に敷き詰めるマークの模様（SVG の data URL） */
export function patternUrl(theme: Theme): string {
  const shape = SUIT_SHAPES[theme.suit];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112" fill="${theme.character}">` +
    `<g opacity=".22" transform="translate(10 10) rotate(-14 13 13) scale(1.1)">${shape}</g>` +
    `<g opacity=".14" transform="translate(66 64) rotate(12 10 10) scale(.8)">${shape}</g>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** テーマの色と模様を CSS 変数として反映する */
export function applyTheme(id: ThemeId, root: HTMLElement = document.documentElement): void {
  const theme = getTheme(id);
  const c = theme.colors;
  const vars: Record<string, string> = {
    '--bg': c.bg,
    '--surface': c.surface,
    '--surface-2': c.surface2,
    '--border': c.border,
    '--text': c.text,
    '--muted': c.muted,
    '--accent': c.accent,
    '--accent-text': c.accentText,
    '--hero-from': c.hero[0],
    '--hero-to': c.hero[1],
    '--hero-text': c.heroText,
    '--danger': c.danger,
    '--pattern': patternUrl(theme),
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  root.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.bg);
}
