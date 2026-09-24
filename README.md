# photo-katsudou（フォトカツドウ）

好きな画像をフレームとしてカメラ映像に重ね、そのまま撮影できるブラウザ用カメラアプリ（PWA）。
ホーム画面に追加して使うことを前提にしています。

- 画像素材を端末内（IndexedDB）に登録。透過 PNG の透けた部分にはカメラ映像が映る
- 素材を複数重ねてフレームを作成。位置・大きさ・回転・重なり順・不透明度を調整でき、レイヤーごとにロック可能
- 縦長・横長どちらのフレームにも対応。カメラ映像はフレームの比率で切り抜く
- 撮影後にプレビューし、保存（iOS は共有シートの「画像を保存」）・共有・撮り直しができる
- 画像や写真は外部に送信しない

設計の詳細は [docs/design.md](docs/design.md) を参照。

## 開発

Node.js 22 以降。

```sh
npm install
npm run dev      # 開発サーバー
npm test         # 単体テスト（Vitest）
npm run lint     # ESLint
npm run format   # Prettier
npm run build    # 型チェック + 本番ビルド（dist/）
npm run preview  # ビルド結果の確認
```

カメラは HTTPS か `localhost` でしか使えません。スマートフォン実機で開発サーバーを確認する場合は
HTTPS で公開する手段（トンネリングサービス等）を使ってください。

## 公開

`npm run build` で出力される `dist/` の中身を、公開用リポジトリの GitHub Pages に置きます。
相対パス（`base: './'`）と HashRouter でビルドしているため、どのパスに置いても動きます。

## ディレクトリ構成

```
src/
  pages/        画面（ホーム・カメラ・フレーム一覧/編集・素材・設定・使い方）
  components/   画面を構成する部品
  hooks/        カメラ制御・Undo 履歴などのフック
  db/           IndexedDB（Dexie）への保存・読み込み
  lib/          レイアウト計算・描画・端末判定などの純粋な処理
  store/        設定などの状態（Zustand）
```
