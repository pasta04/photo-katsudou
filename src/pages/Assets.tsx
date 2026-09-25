import { Frame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AssetLibrary } from '../components/AssetLibrary';
import { TopBar } from '../components/TopBar';

export function Assets() {
  return (
    <div className="page-with-bar">
      <TopBar title="素材">
        <Link to="/frames" className="icon-button" aria-label="フレーム" title="フレーム">
          <Frame />
        </Link>
      </TopBar>
      <main className="page">
        <p className="muted">タップすると名前の変更・削除ができます。</p>
        <AssetLibrary />
      </main>
    </div>
  );
}
