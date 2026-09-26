import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Maximize,
  Plus,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { db } from '../db/db';
import type { Layer } from '../types';
import { AssetThumb } from './AssetLibrary';
import { FlipHorizontalIcon, FlipVerticalIcon } from './icons';

interface Props {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Layer>, coalesce?: string) => void;
  onMove: (id: string, direction: 1 | -1) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onFit: (id: string) => void;
  onAdd: () => void;
}

export function LayerPanel(props: Props) {
  const { layers, selectedId, onSelect, onChange, onAdd } = props;
  const assets = useLiveQuery(() => db.assets.toArray(), []);
  const assetMap = new Map(assets?.map((a) => [a.id, a]));
  const selected = layers.find((l) => l.id === selectedId);
  const selectedIndex = selected ? layers.indexOf(selected) : -1;

  return (
    <aside className="layer-panel">
      {selected && (
        <div className="layer-tools">
          <div className="tool-row">
            <IconButton
              label="前面へ"
              onClick={() => props.onMove(selected.id, 1)}
              disabled={selectedIndex === layers.length - 1}
            >
              <ChevronUp />
            </IconButton>
            <IconButton
              label="背面へ"
              onClick={() => props.onMove(selected.id, -1)}
              disabled={selectedIndex === 0}
            >
              <ChevronDown />
            </IconButton>
            <IconButton
              label="左右反転"
              onClick={() => onChange(selected.id, { flipX: !selected.flipX })}
            >
              <FlipHorizontalIcon />
            </IconButton>
            <IconButton
              label="上下反転"
              onClick={() => onChange(selected.id, { flipY: !selected.flipY })}
            >
              <FlipVerticalIcon />
            </IconButton>
            <IconButton label="フレームに合わせる" onClick={() => props.onFit(selected.id)}>
              <Maximize />
            </IconButton>
            <IconButton label="複製" onClick={() => props.onDuplicate(selected.id)}>
              <Copy />
            </IconButton>
            <IconButton label="削除" onClick={() => props.onRemove(selected.id)}>
              <Trash2 />
            </IconButton>
          </div>
          <label className="slider">
            <span>不透明度</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={selected.opacity}
              onChange={(e) =>
                onChange(selected.id, { opacity: Number(e.target.value) }, `opacity:${selected.id}`)
              }
            />
            <span className="slider-value">{Math.round(selected.opacity * 100)}%</span>
          </label>
        </div>
      )}

      <div className="layer-list-header">
        <span>上のものが前面に表示されます</span>
        <button className="button small primary" onClick={onAdd}>
          <Plus />
          素材を追加
        </button>
      </div>
      {layers.length === 0 && <p className="empty">「素材を追加」から画像を配置してください。</p>}
      <ul className="layer-list">
        {[...layers].reverse().map((layer) => {
          const asset = assetMap.get(layer.assetId);
          return (
            <li
              key={layer.id}
              className={`layer-item${layer.id === selectedId ? ' selected' : ''}${layer.visible ? '' : ' hidden-layer'}`}
            >
              <button className="layer-item-main" onClick={() => onSelect(layer.id)}>
                {asset ? <AssetThumb asset={asset} /> : <span className="thumb" />}
                <span className="layer-name">{asset?.name ?? '（素材なし）'}</span>
              </button>
              <IconButton
                label={layer.visible ? '非表示にする' : '表示する'}
                onClick={() => onChange(layer.id, { visible: !layer.visible })}
              >
                {layer.visible ? <Eye /> : <EyeOff />}
              </IconButton>
              <IconButton
                label={layer.locked ? 'ロックを解除' : 'ロック'}
                onClick={() => onChange(layer.id, { locked: !layer.locked })}
                active={layer.locked}
              >
                {layer.locked ? <Lock /> : <LockOpen />}
              </IconButton>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`icon-button${active ? ' active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
