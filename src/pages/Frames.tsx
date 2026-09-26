import { useLiveQuery } from 'dexie-react-hooks';
import { Copy, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '../components/Dialog';
import { FrameThumb } from '../components/FrameThumb';
import { NewFrameDialog } from '../components/NewFrameDialog';
import { TopBar } from '../components/TopBar';
import { db } from '../db/db';
import { deleteFrame, duplicateFrame, renameFrame } from '../db/frames';
import { formatAspect } from '../lib/layout';
import type { Frame } from '../types';

export function Frames() {
  const frames = useLiveQuery(() => db.frames.orderBy('updatedAt').reverse().toArray(), []);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [menuFor, setMenuFor] = useState<Frame | null>(null);

  return (
    <div className="page-with-bar">
      <TopBar title="フレーム">
        <Link to="/assets" className="icon-button" aria-label="素材" title="素材">
          <Images />
        </Link>
      </TopBar>
      <main className="page">
        <button className="button primary" onClick={() => setCreating(true)}>
          <Plus />
          新しいフレームを追加
        </button>
        {frames?.length === 0 && <p className="empty">まだフレームがありません。</p>}
        <ul className="frame-grid">
          {frames?.map((frame) => (
            <li key={frame.id}>
              <FrameCard
                frame={frame}
                onOpen={() => navigate(`/frames/${frame.id}`)}
                onMenu={() => setMenuFor(frame)}
              />
            </li>
          ))}
        </ul>
      </main>
      {creating && (
        <NewFrameDialog
          onClose={() => setCreating(false)}
          onCreated={(frame) => navigate(`/frames/${frame.id}`)}
        />
      )}
      {menuFor && <FrameMenu frame={menuFor} onClose={() => setMenuFor(null)} />}
    </div>
  );
}

function FrameCard({
  frame,
  onOpen,
  onMenu,
}: {
  frame: Frame;
  onOpen: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="frame-card">
      <button className="frame-card-main" onClick={onOpen}>
        <span className="frame-card-thumb">
          <FrameThumb frame={frame} />
        </span>
        <span className="frame-card-name">{frame.name}</span>
        <span className="muted small">{formatAspect(frame.aspect)}</span>
      </button>
      <button className="frame-card-menu" onClick={onMenu} aria-label="メニュー">
        …
      </button>
    </div>
  );
}

function FrameMenu({ frame, onClose }: { frame: Frame; onClose: () => void }) {
  const [name, setName] = useState(frame.name);

  const run = (action: () => Promise<void>) => async () => {
    await action();
    onClose();
  };

  return (
    <Dialog
      title="フレーム"
      onClose={onClose}
      actions={
        <>
          <button
            className="button danger"
            onClick={run(async () => {
              if (confirm(`「${frame.name}」を削除しますか？`)) await deleteFrame(frame.id);
            })}
          >
            <Trash2 />
            削除
          </button>
          <button className="button" onClick={run(() => duplicateFrame(frame.id))}>
            <Copy />
            複製
          </button>
          <span className="spacer" />
          <button
            className="button primary"
            onClick={run(() => renameFrame(frame.id, name.trim() || frame.name))}
          >
            <Pencil />
            保存
          </button>
        </>
      }
    >
      <label className="field">
        <span>名前</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </Dialog>
  );
}
