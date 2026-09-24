import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

/**
 * 配信チャンネル。ビルド時に環境変数 APP_CHANNEL で指定する。
 * - dev: 動作確認用の開発版（このリポジトリの GitHub Pages）。既定値
 * - prod: 一般公開版（別リポジトリの GitHub Pages）
 * ホーム画面に両方追加しても見分けられるよう、アプリ名を変える。
 */
const channel = process.env.APP_CHANNEL === 'prod' ? 'prod' : 'dev';
const isDev = channel === 'dev';
const appName = isDev ? 'デミカメラ 開発版' : 'デミカメラ';
const shortName = isDev ? 'デミカメラ開発' : 'デミカメラ';
// APP_COMMIT はビルドしたコミットを明示するとき（リリース時など）に使う
const commit = (process.env.APP_COMMIT ?? process.env.GITHUB_SHA ?? '').slice(0, 7);

// 配置先のパスに依存しないよう相対パスでビルドする
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_CHANNEL__: JSON.stringify(channel),
    __APP_COMMIT__: JSON.stringify(commit),
  },
  plugins: [
    react(),
    {
      name: 'app-name-in-html',
      transformIndexHtml: (html) =>
        html.replaceAll('%APP_NAME%', appName).replaceAll('%APP_SHORT_NAME%', shortName),
    },
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        // 開発版と公開版が同じ端末に入っても別アプリとして扱われるようにする。
        // インストール済みのアプリを引き継ぐため、アプリ名を変えてもこの値は変えない
        id: `photo-katsudou-${channel}`,
        name: appName,
        short_name: shortName,
        description: '好きなフレームを重ねて撮影できるカメラアプリ',
        lang: 'ja',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#111111',
        theme_color: '#111111',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
