import { useRegisterSW } from 'virtual:pwa-register/react';

/** 新しいバージョンが配信されたときに更新を促す */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div className="toast">
      <span>新しいバージョンがあります</span>
      <button className="button small" onClick={() => setNeedRefresh(false)}>
        あとで
      </button>
      <button className="button small primary" onClick={() => updateServiceWorker(true)}>
        更新
      </button>
    </div>
  );
}
