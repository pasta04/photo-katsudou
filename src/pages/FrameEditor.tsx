import { Lock, LockOpen, Redo2, Settings2, Undo2, Video, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const AUTOSAVE_DELAY = 500;

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editable, setEditable] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useAutosave(frame, initial);

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
    setEditable(true);
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
      <TopBar title={frame.name} back="/frames">
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
      </TopBar>

      <div className="editor-body">
        <div className="editor-main">
          <EditorStage
            frame={frame}
            images={images}
            editable={editable}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangeLayer={changeLayer}
            showCamera={showCamera}
          />
          <div className="editor-mode-bar">
            <button
              className={`mode-toggle${editable ? ' editing' : ''}`}
              onClick={() => setEditable((v) => !v)}
            >
              {editable ? <LockOpen /> : <Lock />}
              {editable ? '編集中' : '配置を固定中'}
            </button>
          </div>
        </div>
        <LayerPanel
          layers={frame.layers}
          selectedId={selectedId}
          editable={editable}
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

/** 変更をしばらく待ってから保存する。画面を離れるときは即保存する */
function useAutosave(frame: Frame, initial: Frame) {
  const latest = useRef(frame);
  const saved = useRef(initial);

  useEffect(() => {
    latest.current = frame;
    if (frame === saved.current) return;
    const timer = setTimeout(() => {
      saved.current = frame;
      saveFrame(frame);
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [frame]);

  useEffect(() => {
    const flush = () => {
      if (latest.current === saved.current) return;
      saved.current = latest.current;
      saveFrame(latest.current);
    };
    // ホーム画面アプリはタスク切り替えでそのまま終了されることがある
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, []);
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
        <p className="muted small">
          比率を変えても素材は歪みませんが、位置は比率に合わせて移動します。
        </p>
      </div>
    </Dialog>
  );
}
