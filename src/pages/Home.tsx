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
            <strong>カメラで撮影</strong>
            <p>作ったフレームを選んで撮影します。撮った写真は保存・共有できます。</p>
          </div>
        </Link>
        <Link to="/frames" className="home-card">
          <Frame />
          <div>
            <strong>フレームを編集</strong>
            <p>素材を並べてフレームを作ります。位置・大きさ・重なり順を自由に調整できます。</p>
          </div>
        </Link>
        <Link to="/assets" className="home-card">
          <Images />
          <div>
            <strong>素材を管理</strong>
            <p>フレームに使う画像を登録します。透過 PNG は透けた部分にカメラ映像が映ります。</p>
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
