# CLAUDE.md

## Pull Request

- PR を作るときは、改修箇所の表示イメージ（スクリーンショット）を PR 本文に添付する。
  - 画面の見た目が変わらない変更（CI・ドキュメントのみなど）は不要。
  - `npm run build && npx vite preview` で起動し、Playwright（スマートフォン幅 390px 程度）で撮る。
    テーマなどで見た目が複数ある場合は並べた 1 枚にまとめる。
  - 画像は PR のブランチの `docs/screenshots/` にコミットし、本文からはコミット SHA 固定の URL で参照する。
    例: `https://github.com/pasta04/photo-katsudou/blob/<SHA>/docs/screenshots/xxx.png?raw=true`
