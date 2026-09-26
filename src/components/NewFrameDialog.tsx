import { useState } from 'react';
import { createFrame } from '../db/frames';
import { formatAspect } from '../lib/layout';
import type { Asset, Aspect, Frame } from '../types';
import { AssetLibrary, AssetThumb } from './AssetLibrary';
import { AspectPicker } from './AspectPicker';
import { Dialog } from './Dialog';

interface Props {
  onClose: () => void;
  onCreated: (frame: Frame) => void;
}

type Source = 'asset' | 'aspect';

export function NewFrameDialog({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [source, setSource] = useState<Source>('asset');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [aspect, setAspect] = useState<Aspect>({ w: 3, h: 4 });
  const [picking, setPicking] = useState(false);

  const canCreate = source === 'aspect' || asset !== null;

  const create = async () => {
    const frameName = name.trim() || asset?.name || '新しいフレーム';
    const frame =
      source === 'asset' && asset
        ? await createFrame(frameName, { w: asset.width, h: asset.height }, asset)
        : await createFrame(frameName, aspect);
    onCreated(frame);
  };

  if (picking) {
    return (
      <Dialog title="素材を選ぶ" onClose={() => setPicking(false)} sheet>
        <AssetLibrary
          onPick={(a) => {
            setAsset(a);
            setSource('asset');
            setPicking(false);
          }}
        />
      </Dialog>
    );
  }

  return (
    <Dialog
      title="新しいフレーム"
      onClose={onClose}
      actions={
        <>
          <button className="button" onClick={onClose}>
            キャンセル
          </button>
          <button className="button primary" onClick={create} disabled={!canCreate}>
            作成
          </button>
        </>
      }
    >
      <label className="field">
        <span>名前</span>
        <input
          value={name}
          placeholder="新しいフレーム"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <p>作成するフレームの比率を選択してね。</p>

      <div className="segmented">
        <button className={source === 'asset' ? 'selected' : ''} onClick={() => setSource('asset')}>
          画像の比率に合わせる
        </button>
        <button
          className={source === 'aspect' ? 'selected' : ''}
          onClick={() => setSource('aspect')}
        >
          比率を選ぶ
        </button>
      </div>

      {source === 'asset' ? (
        <div className="stack">
          <p className="muted">完成済みのフレーム画像を使うときはこちら。</p>
          <button className="asset-choice" onClick={() => setPicking(true)}>
            {asset ? (
              <>
                <AssetThumb asset={asset} />
                <span>
                  {asset.name}
                  <br />
                  <span className="muted">{formatAspect({ w: asset.width, h: asset.height })}</span>
                </span>
              </>
            ) : (
              <span>画像を選ぶ…</span>
            )}
          </button>
        </div>
      ) : (
        <div className="stack">
          <AspectPicker value={aspect} onChange={setAspect} />
        </div>
      )}
    </Dialog>
  );
}
