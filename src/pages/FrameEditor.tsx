import { Redo2, Save, Settings2, Undo2, Video, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AspectPicker } from '../components/AspectPicker';
import { AssetLibrary } from '../components/AssetLibrary';
import { Dialog } from '../components/Dialog';
import { EditorStage } from '../components/EditorStage';
import { LayerPanel } from '../components/LayerPanel';
import { TopBar } from '../components/TopBar';
import { db, newId } from '../db/db';
import { newLayer, saveFrame } from '../db/frames';
import { useAssetImages } from '../hooks/useAssetImages';
import { useHistory } from '../hooks/useHistory';
import { fitWidth, sameAspect } from '../lib/layout';
import type { Asset, Frame, Layer } from '../types';

export function FrameEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<Frame | null | undefined>(undefined);

  useEffect(() => {
    if (id) db.frames.get(id).then((f) => setLoaded(f ?? null));
  }, [id]);

  if (loaded === undefined) return <div className="page-with-bar" />;
  if (loaded === null) {
    return (
      <div className="page-with-bar">
        <TopBar title="フレーム" back="/frames" />
        <main className="page">
          <p className="empty">フレームが見つかりませんでした。</p>
          <button className="button" onClick={() => navigate('/frames')}>
            一覧へ戻る
          </button>
        </main>
      </div>
    );
  }
  return <Editor initial={loaded} />;
}

function Editor({ initial }: { initial: Frame }) {
  const history = useHistory<Frame>(initial);
  const frame = history.present;
  const images = useAssetImages(frame.layers);
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [saving, setSaving] = useState(false);
  /** 最後に保存した状態。present と違えば未保存の変更がある */
  const [savedFrame, setSavedFrame] = useState(initial);
  const dirty = frame !== savedFrame;

  useUnloadWarning(dirty);

  const save = async () => {
    setSaving(true);
    try {
      await saveFrame(frame);
      setSavedFrame(frame);
    } finally {
      setSaving(false);
    }
  };
  const goBack = () => navigate('/frames');

  const update = useCallback(
    (patch: Partial<Frame>, coalesce?: string) => history.set({ ...frame, ...patch }, coalesce),
    [frame, history],
  );
  const setLayers = (layers: Layer[], coalesce?: string) => update({ layers }, coalesce);
  const changeLayer = (id: string, patch: Partial<Layer>, coalesce?: string) =>
    setLayers(
      frame.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      coalesce,
    );

  const addAsset = (asset: Asset) => {
    const aspect = { w: asset.width, h: asset.height };
    // フレームと同じ比率の画像は全面に、それ以外は中央に小さめに置く
    const layer = sameAspect(aspect, frame.aspect)
      ? newLayer(asset, frame.aspect, { width: fitWidth(asset, frame.aspect) })
      : newLayer(asset, frame.aspect);
    setLayers([...frame.layers, layer]);
    setSelectedId(layer.id);
    setAdding(false);
  };

  const moveLayer = (id: string, direction: 1 | -1) => {
    const i = frame.layers.findIndex((l) => l.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= frame.layers.length) return;
    const layers = [...frame.layers];
    [layers[i], layers[j]] = [layers[j], layers[i]];
    setLayers(layers);
  };

  const duplicateLayer = (id: string) => {
    const i = frame.layers.findIndex((l) => l.id === id);
    if (i < 0) return;
    const src = frame.layers[i];
    const copy = { ...src, id: newId(), cx: src.cx + 0.03, cy: src.cy + 0.03, locked: false };
    setLayers([...frame.layers.slice(0, i + 1), copy, ...frame.layers.slice(i + 1)]);
    setSelectedId(copy.id);
  };

  const fitLayer = (id: string) => {
    const layer = frame.layers.find((l) => l.id === id);
    const img = layer && images.get(layer.assetId);
    if (!img) return;
    const asset = { width: img.naturalWidth, height: img.naturalHeight };
    changeLayer(id, { cx: 0.5, cy: 0.5, rotation: 0, width: fitWidth(asset, frame.aspect) });
  };

  return (
    <div className="page-with-bar editor">
      <TopBar title={frame.name} onBack={() => (dirty ? setLeaving(true) : goBack())}>
        <button
          className="icon-button"
          onClick={history.undo}
          disabled={!history.canUndo}
          aria-label="元に戻す"
        >
          <Undo2 />
        </button>
        <button
          className="icon-button"
          onClick={history.redo}
          disabled={!history.canRedo}
          aria-label="やり直す"
        >
          <Redo2 />
        </button>
        <button
          className={`icon-button${showCamera ? ' active' : ''}`}
          onClick={() => setShowCamera((v) => !v)}
          aria-label="背景にカメラ映像を表示"
          title="背景にカメラ映像を表示"
        >
          {showCamera ? <Video /> : <VideoOff />}
        </button>
        <button
          className="icon-button"
          onClick={() => setSettingsOpen(true)}
          aria-label="フレームの設定"
        >
          <Settings2 />
        </button>
        <button
          className={`icon-button save-button${dirty ? ' dirty' : ''}`}
          onClick={save}
          disabled={!dirty || saving}
          aria-label="保存"
          title={dirty ? '保存' : '保存済み'}
        >
          <Save />
        </button>
      </TopBar>

      <div className="editor-body">
        <div className="editor-main">
          <EditorStage
            frame={frame}
            images={images}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangeLayer={changeLayer}
            showCamera={showCamera}
          />
        </div>
        <LayerPanel
          layers={frame.layers}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onChange={changeLayer}
          onMove={moveLayer}
          onDuplicate={duplicateLayer}
          onRemove={(id) => {
            setLayers(frame.layers.filter((l) => l.id !== id));
            setSelectedId(null);
          }}
          onFit={fitLayer}
          onAdd={() => setAdding(true)}
        />
      </div>

      {adding && (
        <Dialog title="素材を追加" onClose={() => setAdding(false)} sheet>
          <AssetLibrary onPick={addAsset} />
        </Dialog>
      )}
      {leaving && (
        <Dialog
          title="保存していない変更があります"
          onClose={() => setLeaving(false)}
          actions={
            <>
              <button className="button" onClick={() => setLeaving(false)}>
                戻らない
              </button>
              <button className="button danger" onClick={goBack}>
                戻る
              </button>
            </>
          }
        >
          <p>保存していない変更内容がありますが、フレーム一覧に戻ってよいですか？</p>
          <p className="muted small">戻ると、保存していない変更は失われます。</p>
        </Dialog>
      )}
      {settingsOpen && (
        <FrameSettingsDialog
          frame={frame}
          onClose={() => setSettingsOpen(false)}
          onSave={(patch) => {
            update(patch);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** 未保存の変更があるときは、タブを閉じる・再読み込みの前にブラウザの確認を出す */
function useUnloadWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}

function FrameSettingsDialog({
  frame,
  onClose,
  onSave,
}: {
  frame: Frame;
  onClose: () => void;
  onSave: (patch: Partial<Frame>) => void;
}) {
  const [name, setName] = useState(frame.name);
  const [aspect, setAspect] = useState(frame.aspect);

  return (
    <Dialog
      title="フレームの設定"
      onClose={onClose}
      actions={
        <>
          <button className="button" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="button primary"
            onClick={() => onSave({ name: name.trim() || frame.name, aspect })}
          >
            保存
          </button>
        </>
      }
    >
      <label className="field">
        <span>名前</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="stack">
        <span className="field-label">比率</span>
        <AspectPicker value={aspect} onChange={setAspect} />
        <p className="muted small">比率を変えると、比率に合わせて素材が移動します。</p>
      </div>
    </Dialog>
  );
}
