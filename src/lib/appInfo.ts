export const APP_VERSION = __APP_VERSION__;
export const IS_DEV_CHANNEL = __APP_CHANNEL__ === 'dev';

/** 設定画面などに出すバージョン表記。例: 0.1.0（開発版 abc1234） */
export function versionLabel(): string {
  const details = [IS_DEV_CHANNEL ? '開発版' : '', __APP_COMMIT__].filter(Boolean).join(' ');
  return details ? `${APP_VERSION}（${details}）` : APP_VERSION;
}
