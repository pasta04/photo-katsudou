/// <reference types="vite/client" />

// vite.config.ts の define で埋め込む値

/** package.json の version */
declare const __APP_VERSION__: string;
/** 配信チャンネル。dev は動作確認用の開発版、prod は一般公開版 */
declare const __APP_CHANNEL__: 'dev' | 'prod';
/** ビルドしたコミットの短縮ハッシュ（GitHub Actions 以外では空） */
declare const __APP_COMMIT__: string;
