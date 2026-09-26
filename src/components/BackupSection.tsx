import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  type BackupContents,
  BackupFormatError,
  exportBackup,
  importBackup,
  type ImportMode,
  readBackup,
} from '../db/backup';
import { canShareFile, downloadFile, isIOS, shareFile } from '../lib/platform';
import { Dialog } from './Dialog';

type Status = { kind: 'info' | 'error'; text: string } | null;

/** 設定画面の「バックアップ」欄。素材・フレーム・撮影設定の書き出しと読み込み */
export function BackupSection() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<BackupContents | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const file = await exportBackup();
      // iOS はダウンロードしてもファイルの場所がわかりにくいので、共有メニューの「"ファイル"に保存」を使う
      if (isIOS() && canShareFile(file)) {
        if ((await shareFile(file)) === 'cancelled') return;
      } else {
        downloadFile(file);
      }
      setStatus({ kind: 'info', text: `${file.name} を書き出しました。` });
    } catch (e) {
      setStatus({ kind: 'error', text: `書き出せませんでした: ${message(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setStatus(null);
    try {
      setPending(await readBackup(file));
    } catch (e) {
      setStatus({ kind: 'error', text: message(e) });
    }
  };

  const onImport = async (mode: ImportMode) => {
    if (!pending) return;
    setBusy(true);
    try {
      await importBackup(pending, mode);
      setStatus({
        kind: 'info',
        text: `素材 ${pending.assets.length} 件・フレーム ${pending.frames.length} 件を読み込みました。`,
      });
      setPending(null);
    } catch (e) {
      setStatus({ kind: 'error', text: `読み込めませんでした: ${message(e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2>バックアップ</h2>
      <p className="muted small">
        素材・フレーム・撮影の設定を 1
        つのファイル（zip）に書き出します。機種変更のときや、ブラウザのデータが消えたときに読み込んで元に戻せます。
      </p>
      <div className="row">
        <button className="button" onClick={onExport} disabled={busy}>
          <Download />
          書き出す
        </button>
        <button className="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Upload />
          読み込む
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />
      </div>
      {busy && <p className="muted small">処理しています…</p>}
      {status && (
        <p className={status.kind === 'error' ? 'error-text small' : 'muted small'}>
          {status.text}
        </p>
      )}

      {pending && (
        <Dialog
          title="バックアップを読み込む"
          onClose={() => !busy && setPending(null)}
          actions={
            <>
              <button className="button" onClick={() => setPending(null)} disabled={busy}>
                キャンセル
              </button>
              <button className="button danger" onClick={() => onImport('replace')} disabled={busy}>
                置き換える
              </button>
              <button className="button primary" onClick={() => onImport('merge')} disabled={busy}>
                追加する
              </button>
            </>
          }
        >
          <p>
            素材 {pending.assets.length} 件・フレーム {pending.frames.length} 件
            {pending.exportedAt && (
              <>
                <br />
                <span className="muted small">
                  {new Date(pending.exportedAt).toLocaleString('ja-JP')} に書き出したファイル
                </span>
              </>
            )}
          </p>
          <ul className="small">
            <li>
              <strong>追加する</strong>
              ：今のデータを残したまま読み込みます。同じ素材・フレームはバックアップの内容で上書きします。
            </li>
            <li>
              <strong>置き換える</strong>：今の素材・フレームをすべて削除してから読み込みます。
            </li>
          </ul>
          <p className="muted small">撮影の設定もバックアップの内容に変わります。</p>
          {busy && <p className="muted small">読み込んでいます…</p>}
        </Dialog>
      )}
    </section>
  );
}

function message(e: unknown): string {
  if (e instanceof BackupFormatError) return e.message;
  return e instanceof Error ? e.message : String(e);
}
