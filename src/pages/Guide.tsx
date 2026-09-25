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
          <h2>ホーム画面に追加する</h2>
          <p>
            このアプリはホーム画面に追加して使うことを前提にしています。追加すると全画面で使えるようになり、登録した素材やフレームも消えにくくなります。
          </p>
          {(ios || !android) && (
            <div className="guide-box">
              <h3>iPhone / iPad（Safari）</h3>
              <ol>
                <li>画面下（iPad は上）の共有ボタン（□に↑）をタップ</li>
                <li>メニューを下にスクロールして「ホーム画面に追加」をタップ</li>
                <li>右上の「追加」をタップ</li>
                <li>ホーム画面にできたアイコンから起動</li>
              </ol>
              <p className="muted small">
                iPhone では Safari
                で開いたときとホーム画面から開いたときでデータが別々に保存されます。素材やフレームはホーム画面から開いたアプリで登録してください。
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
          <h2>フレームを作る</h2>
          <ol>
            <li>
              「素材を管理」でフレームに使う画像を登録します。透過 PNG
              の透けている部分にはカメラ映像が映ります。
            </li>
            <li>
              「フレームを編集」で「新しいフレーム」を作ります。完成済みのフレーム画像が 1
              枚あるなら「画像の比率に合わせる」を選ぶと、そのまま使えます。
            </li>
            <li>
              「素材を追加」で画像を重ね、ドラッグで移動、四隅のハンドルや 2
              本指のピンチで拡大縮小・回転します。
            </li>
            <li>
              動かしたくないレイヤーは鍵アイコンでロックします。ロックしたレイヤーはタップしても選択されず、下のレイヤーを操作できます。
            </li>
            <li>「編集中」ボタンを押すと配置を固定し、誤って動かさないようにできます。</li>
          </ol>
          <p className="muted small">
            画像の余分な部分を取り除きたいときは、登録前に端末の写真アプリでトリミングしてください。
          </p>
        </section>

        <section>
          <h2>撮影する</h2>
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
        </section>

        <section>
          <h2>カメラが使えないとき</h2>
          <ul>
            <li>
              カメラの使用を「許可しない」にした場合は、iPhone は「設定 → Safari → カメラ」、Android
              は Chrome のサイト設定からカメラを許可してください。
            </li>
            <li>ほかのアプリがカメラを使っていると開けないことがあります。</li>
          </ul>
        </section>

        <section>
          <h2>データについて</h2>
          <p>
            登録した画像・フレーム・撮影した写真は、すべてこの端末の中だけで扱われ、外部のサーバーには送信されません。
          </p>
          <p>
            機種変更のときや、ブラウザのデータが消えたときに備えて、設定画面の「バックアップ」から素材とフレームをファイルに書き出しておけます。書き出したファイルは、別の端末や、Safari
            とホーム画面のアプリの間でも読み込めます。
          </p>
        </section>
      </main>
    </div>
  );
}
