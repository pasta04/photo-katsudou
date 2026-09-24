import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PhotoFormat = 'jpeg' | 'png';

interface SettingsState {
  photoFormat: PhotoFormat;
  /** JPEG の画質 0〜1 */
  jpegQuality: number;
  /** 前面カメラの映像を画面の見た目どおり（左右反転）で保存するか */
  mirrorFrontCamera: boolean;
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
      photoFormat: 'jpeg',
      jpegQuality: 0.92,
      mirrorFrontCamera: true,
      showGrid: false,
      timerSeconds: 0,
      lastFrameId: null,
      lastDeviceId: null,
      set: (patch) => set(patch),
    }),
    { name: 'demi-camera-settings' },
  ),
);
