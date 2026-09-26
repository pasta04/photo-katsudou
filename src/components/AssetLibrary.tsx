import { useLiveQuery } from 'dexie-react-hooks';
import { ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { deleteAsset, framesUsingAsset, importAsset, renameAsset } from '../db/assets';
import { db } from '../db/db';
import { useBlobUrl } from '../hooks/useBlobUrl';
import type { Asset } from '../types';
import { Dialog } from './Dialog';

interface Props {
  /** 渡すと「選ぶ」モードになり、素材をタップすると呼ばれる */
  onPick?: (asset: Asset) => void;
}

/** 素材の一覧・登録・名前変更・削除 */
export function AssetLibrary({ onPick }: Props) {
  const assets = useLiveQuery(() => db.assets.orderBy('createdAt').reverse().toArray(), []);
  const [editing, setEditing] = useState<Asset | null>(null);

  return (
    <div className="asset-library">
      <AssetUploadButton onImported={(list) => list.length === 1 && onPick?.(list[0])} />
      {assets?.length === 0 && (
        <p className="empty">
          まだ素材がありません。
        </p>
      )}
      <ul className="asset-grid">
        {assets?.map((asset) => (
          <li key={asset.id}>
            <button
              className="asset-cell"
              onClick={() => (onPick ? onPick(asset) : setEditing(asset))}
            >
              <AssetThumb asset={asset} />
              <span className="asset-name">{asset.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {editing && <AssetEditDialog asset={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function AssetThumb({ asset }: { asset: Asset }) {
  const url = useBlobUrl(asset.thumbnail);
  return <span className="thumb checker">{url && <img src={url} alt="" draggable={false} />}</span>;
}

function AssetUploadButton({ onImported }: { onImported: (assets: Asset[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onChange = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const imported: Asset[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        imported.push(await importAsset(file));
      } catch (e) {
        errors.push(`${file.name}: ${e instanceof Error ? e.message : e}`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    if (errors.length) alert(errors.join('\n'));
    onImported(imported);
  };

  return (
    <label className={`button primary upload-button${busy ? ' disabled' : ''}`}>
      <ImagePlus />
      {busy ? '読み込み中…' : '画像を追加'}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/webp,image/jpeg,image/*"
        multiple
        hidden
        disabled={busy}
        onChange={(e) => onChange(e.target.files)}
      />
    </label>
  );
}

function AssetEditDialog({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [name, setName] = useState(asset.name);
  const url = useBlobUrl(asset.blob);

  const save = async () => {
    await renameAsset(asset.id, name.trim() || asset.name);
    onClose();
  };

  const remove = async () => {
    const used = await framesUsingAsset(asset.id);
    const message = used.length
      ? `この素材は次のフレームで使われています。削除するとフレームからも取り除かれます。\n\n${used.join('\n')}\n\n削除しますか？`
      : 'この素材を削除しますか？';
    if (!confirm(message)) return;
    await deleteAsset(asset.id);
    onClose();
  };

  return (
    <Dialog
      title="素材"
      onClose={onClose}
      actions={
        <>
          <button className="button danger" onClick={remove}>
            <Trash2 />
            削除
          </button>
          <span className="spacer" />
          <button className="button" onClick={onClose}>
            キャンセル
          </button>
          <button className="button primary" onClick={save}>
            <Pencil />
            保存
          </button>
        </>
      }
    >
      <div className="asset-preview checker">{url && <img src={url} alt="" />}</div>
      <p className="muted">
        {asset.width} × {asset.height} px
      </p>
      <label className="field">
        <span>名前</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </Dialog>
  );
}
