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

ビルド時の環境変数 `APP_CHANNEL` で配信チャンネルを切り替えます。

| チャンネル    | 用途               | 公開先                                  | アプリ名              |
| ------------- | ------------------ | --------------------------------------- | --------------------- |
| `dev`（既定） | 動作確認用の開発版 | このリポジトリの GitHub Pages           | フォトカツドウ 開発版 |
| `prod`        | 一般公開版         | 別リポジトリの GitHub Pages（整備予定） | フォトカツドウ        |

開発版と公開版はアプリ名と manifest の `id` が異なるため、同じ端末のホーム画面に両方追加しても区別できます。
相対パス（`base: './'`）と HashRouter でビルドしているため、どのパスに置いても動きます。

### 開発版のデプロイ

`main` に push すると `.github/workflows/deploy-dev.yml` が動き、テストとビルドのあと GitHub Pages にデプロイします。
Actions 画面の「Deploy dev」から手動でも実行できます。

初回のみ、リポジトリの Settings → Pages → Build and deployment → Source を「GitHub Actions」にしてください。

### 一般公開版のビルド

```sh
APP_CHANNEL=prod npm run build
```

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
