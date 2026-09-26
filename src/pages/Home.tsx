import { Camera, CircleHelp, Frame, Images, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstallBanner } from '../components/InstallBanner';
import { IS_DEV_CHANNEL } from '../lib/appInfo';

export function Home() {
  return (
    <main className="page home">
      {IS_DEV_CHANNEL && <span className="dev-badge">開発版</span>}

      <InstallBanner />

      <nav className="home-menu">
        <Link to="/camera" className="home-card primary">
          <Camera />
          <div>
            <strong>カメラ撮影</strong>
            <p>作成したフレームで素敵な写真を撮ってね</p>
          </div>
        </Link>
        <Link to="/frames" className="home-card">
          <Frame />
          <div>
            <strong>フレーム編集</strong>
            <p>登録した素材で写真のフレームを作れます</p>
          </div>
        </Link>
        <Link to="/assets" className="home-card">
          <Images />
          <div>
            <strong>素材管理</strong>
            <p>フレームに使う画像の登録・削除はここから</p>
          </div>
        </Link>
      </nav>

      <nav className="home-links">
        <Link to="/guide" className="button">
          <CircleHelp />
          使い方
        </Link>
        <Link to="/settings" className="button">
          <Settings />
          設定
        </Link>
      </nav>
    </main>
  );
}
