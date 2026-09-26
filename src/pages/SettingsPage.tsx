import { useEffect, useState } from 'react';
import { BackupSection } from '../components/BackupSection';
import { ThemePicker } from '../components/ThemePicker';
import { TopBar } from '../components/TopBar';
import { db } from '../db/db';
import { versionLabel } from '../lib/appInfo';
import { useSettings } from '../store/settings';

export function SettingsPage() {
  const settings = useSettings();
  const storage = useStorageInfo();

  const deleteAll = async () => {
    if (!confirm('登録した素材とフレームをすべて削除します。元に戻せません。よろしいですか？'))
      return;
    await db.delete();
    localStorage.clear();
    location.reload();
  };

  return (
    <div className="page-with-bar">
      <TopBar title="設定" />
      <main className="page settings">
        <section>
          <h2>テーマ</h2>
          <ThemePicker />
        </section>

        <section>
          <h2>保存する写真</h2>
          <label className="field">
            <span>ファイル形式</span>
            <select
              value={settings.photoFormat}
              onChange={(e) => settings.set({ photoFormat: e.target.value as 'jpeg' | 'png' })}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
            </select>
          </label>
          {settings.photoFormat === 'jpeg' && (
            <label className="slider">
              <span>JPEG 画質</span>
              <input
                type="range"
                min={0.6}
                max={1}
                step={0.01}
                value={settings.jpegQuality}
                onChange={(e) => settings.set({ jpegQuality: Number(e.target.value) })}
              />
              <span className="slider-value">{Math.round(settings.jpegQuality * 100)}</span>
            </label>
          )}
        </section>

        <BackupSection />

        <section>
          <h2>データ</h2>
          {storage && (
            <p>
              使用量: 約 {formatBytes(storage.usage)}
              {storage.quota ? ` / 上限 約 ${formatBytes(storage.quota)}` : ''}
              <br />
              <span className="muted small">
                {storage.persisted
                  ? 'データは消されにくい設定になっています。'
                  : '端末の空き容量が少なくなると、ブラウザがデータを削除することがあります。ホーム画面に追加して使うと消されにくくなります。'}
              </span>
            </p>
          )}
          <button className="button danger" onClick={deleteAll}>
            すべてのデータを削除
          </button>
        </section>

        <section>
          <p className="muted small">バージョン {versionLabel()}</p>
        </section>
      </main>
    </div>
  );
}

function useStorageInfo() {
  const [info, setInfo] = useState<{ usage: number; quota: number; persisted: boolean }>();
  useEffect(() => {
    (async () => {
      if (!navigator.storage?.estimate) return;
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const persisted = (await navigator.storage.persisted?.()) ?? false;
      setInfo({ usage, quota, persisted });
    })();
  }, []);
  return info;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
