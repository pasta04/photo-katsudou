import { Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isStandalone } from '../lib/platform';
import { useInstall } from '../store/install';

/** ブラウザで開かれているとき、ホーム画面への追加を促す */
export function InstallBanner() {
  const promptEvent = useInstall((s) => s.promptEvent);
  const install = useInstall((s) => s.install);
  if (isStandalone()) return null;

  return (
    <section className="install-banner">
      <Smartphone className="install-icon" />
      <div>
        <strong>ホーム画面に追加して使ってください</strong>
        <p>アプリとして全画面で使えるようになって便利です</p>
        <div className="row">
          {promptEvent && (
            <button className="button primary" onClick={install}>
              ホーム画面に追加
            </button>
          )}
          <Link className="button" to="/guide">
            追加のしかた
          </Link>
        </div>
      </div>
    </section>
  );
}
