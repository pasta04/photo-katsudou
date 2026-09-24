import { RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { isPortrait, sameAspect } from '../lib/layout';
import type { Aspect } from '../types';

/** 縦長で定義したプリセット。横長は縦横を入れ替えて使う */
const PRESETS: Aspect[] = [
  { w: 3, h: 4 },
  { w: 2, h: 3 },
  { w: 9, h: 16 },
  { w: 4, h: 5 },
  { w: 1, h: 1 },
];

interface Props {
  value: Aspect;
  onChange: (aspect: Aspect) => void;
}

export function AspectPicker({ value, onChange }: Props) {
  const portrait = isPortrait(value) || value.w === value.h;
  const oriented = (a: Aspect): Aspect => (portrait ? a : { w: a.h, h: a.w });

  return (
    <div className="aspect-picker">
      <div className="segmented">
        <button
          className={portrait ? 'selected' : ''}
          onClick={() => !portrait && onChange({ w: value.h, h: value.w })}
        >
          <RectangleVertical />縦
        </button>
        <button
          className={!portrait ? 'selected' : ''}
          onClick={() => portrait && value.w !== value.h && onChange({ w: value.h, h: value.w })}
        >
          <RectangleHorizontal />横
        </button>
      </div>
      <div className="aspect-presets">
        {PRESETS.map((p) => {
          const a = oriented(p);
          const selected = sameAspect(a, value);
          return (
            <button
              key={`${p.w}:${p.h}`}
              className={`aspect-preset${selected ? ' selected' : ''}`}
              onClick={() => onChange(a)}
            >
              <span
                className="aspect-shape"
                style={{ aspectRatio: `${a.w} / ${a.h}`, [a.w > a.h ? 'width' : 'height']: '28px' }}
              />
              {a.w}:{a.h}
            </button>
          );
        })}
      </div>
    </div>
  );
}
