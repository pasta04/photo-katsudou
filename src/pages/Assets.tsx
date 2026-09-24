import { AssetLibrary } from '../components/AssetLibrary';
import { TopBar } from '../components/TopBar';

export function Assets() {
  return (
    <div className="page-with-bar">
      <TopBar title="素材" />
      <main className="page">
        <p className="muted">タップすると名前の変更・削除ができます。</p>
        <AssetLibrary />
      </main>
    </div>
  );
}
