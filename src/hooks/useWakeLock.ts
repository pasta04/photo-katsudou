import { useEffect } from 'react';

/** 画面を表示している間、端末の自動消灯を防ぐ（対応ブラウザのみ） */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || released) return;
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // 省電力モードなどで拒否されることがある。撮影自体には影響しないので無視する
      }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, []);
}
