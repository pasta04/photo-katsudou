import { Club, Diamond, Heart, type LucideIcon, Spade } from 'lucide-react';
import type { CSSProperties } from 'react';
import { type Suit, THEME_IDS, THEMES } from '../lib/theme';
import { useSettings } from '../store/settings';

const SUIT_ICONS: Record<Suit, LucideIcon> = {
  heart: Heart,
  diamond: Diamond,
  spade: Spade,
  club: Club,
};

/** 表示テーマ（Cute / Cool / Sexy / Pop）を選ぶセグメントコントロール */
export function ThemePicker() {
  const theme = useSettings((s) => s.theme);
  const set = useSettings((s) => s.set);

  return (
    <div className="segmented theme-picker" role="radiogroup" aria-label="テーマ">
      {THEME_IDS.map((id) => {
        const t = THEMES[id];
        const Icon = SUIT_ICONS[t.suit];
        const selected = id === theme;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? 'selected' : undefined}
            style={{ '--suit': t.character } as CSSProperties}
            onClick={() => set({ theme: id })}
          >
            <Icon />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
