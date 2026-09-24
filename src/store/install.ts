import { create } from 'zustand';

/** Chrome 系の「アプリをインストール」イベント（標準の型定義にないため自前で定義） */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  promptEvent: BeforeInstallPromptEvent | null;
  install: () => Promise<void>;
}

export const useInstall = create<InstallState>()((set, get) => ({
  promptEvent: null,
  install: async () => {
    const e = get().promptEvent;
    if (!e) return;
    await e.prompt();
    await e.userChoice;
    set({ promptEvent: null });
  },
}));

/** アプリ起動時に一度だけ呼ぶ */
export function listenInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstall.setState({ promptEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstall.setState({ promptEvent: null }));
}
