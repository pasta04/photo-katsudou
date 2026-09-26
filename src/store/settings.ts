import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME, type ThemeId } from '../lib/theme';

export type PhotoFormat = 'jpeg' | 'png';

interface SettingsState {
  /** 表示テーマ */
  theme: ThemeId;
  photoFormat: PhotoFormat;
  /** JPEG の画質 0〜1 */
  jpegQuality: number;
  showGrid: boolean;
  /** セルフタイマー秒数。0 は無効 */
  timerSeconds: number;
  /** カメラ画面で最後に使ったフレーム（null はフレームなし） */
  lastFrameId: string | null;
  lastDeviceId: string | null;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      photoFormat: 'jpeg',
      jpegQuality: 0.92,
      showGrid: false,
      timerSeconds: 0,
      lastFrameId: null,
      lastDeviceId: null,
      set: (patch) => set(patch),
    }),
    { name: 'demi-camera-settings' },
  ),
);
