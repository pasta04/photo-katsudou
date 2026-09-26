import { TopBar } from '../components/TopBar';
import { isAndroid, isIOS } from '../lib/platform';

export function Guide() {
  const ios = isIOS();
  const android = isAndroid();

  return (
    <div className="page-with-bar">
      <TopBar title="使い方" />
      <main className="page guide">
        <section>
          <h2>ホーム画面への追加</h2>
          <p>ホーム画面に追加すると全画面で使えるようになります。</p>
          {(ios || !android) && (
            <div className="guide-box">
              <h3>iPhone（Safari）</h3>
              <ol>
                <li>共有ボタンをタップ</li>
                <li>メニューを下にスクロールして「ホーム画面に追加」をタップ</li>
                <li>右上の「追加」をタップ</li>
                <li>ホーム画面にできたアイコンから起動</li>
              </ol>
              <p className="muted small">
                Safariから開いたときとホーム画面から開いたときでデータが個別に管理されます。素材やフレームはホーム画面から開いたアプリで登録してください。
              </p>
            </div>
          )}
          {(android || !ios) && (
            <div className="guide-box">
              <h3>Android（Chrome）</h3>
              <ol>
                <li>右上の︙メニューをタップ</li>
                <li>「ホーム画面に追加」または「アプリをインストール」をタップ</li>
                <li>ホーム画面にできたアイコンから起動</li>
              </ol>
            </div>
          )}
        </section>

        <section>
          <h2>素材登録～フレーム作成・編集</h2>
          <div className="guide-box">
            <ol>
              <li>「素材を管理」でフレームに使う画像を登録します。</li>
              <li>
                「フレームを編集」で「新しいフレーム」を作ります。最初に名前と画面比率を決めてください。
                完成済みのフレーム画像があるなら「画像の比率に合わせる」を選ぶと、そのまま使えます。
              </li>
              <li>
                「素材を追加」で画像を重ね、ドラッグで移動、四隅のハンドルや2本指のピンチで拡大縮小・回転します。
              </li>
              <li>
                動かしたくないレイヤーは鍵アイコンでロックします。ロックすると移動・拡大縮小・回転・反転・削除・不透明度の変更ができなくなります。
              </li>
              <li>編集した内容は、右上の保存ボタンを押すと保存されます。</li>
            </ol>
          </div>
        </section>

        <section>
          <h2>カメラ撮影</h2>
          <div className="guide-box">
            <ol>
              <li>「カメラで撮影」を開き、右下のボタンでフレームを選びます。</li>
              <li>カメラが複数ある端末では切り替えボタンでカメラを選べます。</li>
              <li>
                シャッターを押すと確認画面が出ます。「保存」で端末に保存、「共有」でほかのアプリに送れます。
              </li>
            </ol>
            {ios && (
              <p className="muted small">
                iPhone
                では「保存」を押すと共有メニューが開きます。「画像を保存」を選ぶと写真アプリに保存されます。
              </p>
            )}
          </div>
        </section>

        <section>
          <h2>カメラが使えないとき</h2>
          <div className="guide-box">
            <ul>
              <li>
                カメラの使用を「許可しない」にした場合は、iPhone は「設定 → Safari →
                カメラ」、Android は Chrome のサイト設定からカメラを許可してください。
              </li>
              <li>ほかのアプリがカメラを使っていると開けないことがあります。</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
