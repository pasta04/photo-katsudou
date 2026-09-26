# デミカメラ

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

### Dev Container

`.devcontainer/devcontainer.json` を用意しています。VS Code の Dev Containers 拡張や GitHub Codespaces で開くと、
Node.js 22 の環境で `npm ci` まで自動で実行されます。

- `node_modules` はコンテナ内のボリュームに置くため、ホスト側の `node_modules` とは別になります
- 5173（`npm run dev`）と 4173（`npm run preview`）がホストの `localhost` に転送されるので、ホストのブラウザでカメラも使えます
- ESLint・Prettier・Vitest の拡張が入り、保存時に Prettier で整形されます

## 公開

ビルド時の環境変数 `APP_CHANNEL` で配信チャンネルを切り替えます。

| チャンネル    | 用途               | 公開先                        | アプリ名          |
| ------------- | ------------------ | ----------------------------- | ----------------- |
| `dev`（既定） | 動作確認用の開発版 | このリポジトリの GitHub Pages | デミカメラ 開発版 |
| `prod`        | 一般公開版         | 別リポジトリの GitHub Pages   | デミカメラ        |

開発版と公開版はアプリ名と manifest の `id` が異なるため、同じ端末のホーム画面に両方追加しても区別できます。
相対パス（`base: './'`）と HashRouter でビルドしているため、どのパスに置いても動きます。

### 開発版のデプロイ

`main` に push すると `.github/workflows/deploy-dev.yml` が動き、テストとビルドのあと GitHub Pages にデプロイします。
Actions 画面の「Deploy dev」から手動でも実行できます。

初回のみ、リポジトリの Settings → Pages → Build and deployment → Source を「GitHub Actions」にしてください。

### 一般公開版のデプロイ

`v` で始まるタグ（例: `v1.0.0`）を push するか、下記の Release ワークフローを実行すると `.github/workflows/deploy-prod.yml` が動き、
lint・テスト・ビルド（`APP_CHANNEL=prod`）のあと、公開先リポジトリのブランチにビルド結果を push します。
公開先ブランチの中身はビルド結果で置き換えます（独自ドメイン用の `CNAME` だけは残します）。

#### 初回の準備

1. 鍵ペアを作る: `ssh-keygen -t ed25519 -N "" -f deploy_key`
2. 公開先リポジトリの Settings → Deploy keys に `deploy_key.pub` を「Allow write access」付きで登録する
3. このリポジトリの Settings → Secrets and variables → Actions で次を設定する
   - Secrets: `PROD_DEPLOY_KEY` に `deploy_key`（秘密鍵）の中身
   - Variables: `PROD_REPOSITORY` に公開先リポジトリ（例: `someone/demi-cam`）
   - Variables: `PROD_BRANCH` に公開先ブランチ（省略時 `main`）
4. 手元の鍵ファイルは削除する
5. 初回の公開後、公開先リポジトリの Settings → Pages で Source を「Deploy from a branch」、
   ブランチを `PROD_BRANCH`、フォルダを `/ (root)` にする

#### リリース手順

ブラウザから実行できます。

1. このリポジトリの Actions → 「Release」→「Run workflow」を開く
2. ブランチは `main` のまま、バージョンの上げ方（`patch` / `minor` / `major`）を選んで実行する

`.github/workflows/release.yml` が lint とテストのあと `npm version` でバージョンを上げ、
コミットとタグ（例: `v0.1.1`）を `main` に push し、続けて一般公開版をデプロイします。

バージョンは上がったが公開だけ失敗した場合は、Actions → 「Deploy prod」→「Run workflow」で
公開するタグ（例: `v0.1.1`）を指定すると、公開だけやり直せます。

手元から行う場合は次のとおりです（タグは `package.json` の `version` と一致している必要があります）。

```sh
npm version patch   # package.json を更新し、コミットとタグを作る。minor / major も可
git push --follow-tags
```

手元で公開版をビルドするだけなら `APP_CHANNEL=prod npm run build`。

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
