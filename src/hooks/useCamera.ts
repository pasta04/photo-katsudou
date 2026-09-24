import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraErrorKind =
  'insecure' | 'unsupported' | 'denied' | 'notfound' | 'inuse' | 'unknown';

export interface CameraState {
  status: 'starting' | 'ready' | 'error';
  error?: CameraErrorKind;
  /** 端末のカメラ一覧（権限が許可されるまではラベルが空のことがある） */
  devices: MediaDeviceInfo[];
  /** 実際に使っているカメラ */
  activeDeviceId?: string;
  /** 'user' なら前面カメラ */
  facingMode?: string;
}

// 端末が出せる範囲で高解像度を要求する（実際の解像度は videoWidth/videoHeight で取得する）
const RESOLUTION = { width: { ideal: 3840 }, height: { ideal: 2160 } };

function errorKind(e: unknown): CameraErrorKind {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') return 'denied';
    if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') return 'notfound';
    if (e.name === 'NotReadableError' || e.name === 'AbortError') return 'inuse';
  }
  return 'unknown';
}

async function openStream(deviceId: string | null): Promise<MediaStream> {
  if (deviceId) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, ...RESOLUTION },
        audio: false,
      });
    } catch (e) {
      // 前回のカメラが無くなっていたら既定のカメラで開き直す
      if (errorKind(e) !== 'notfound') throw e;
    }
  }
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, ...RESOLUTION },
    audio: false,
  });
}

/** カメラ映像を videoRef の <video> に流す。deviceId が変わると切り替える */
export function useCamera(deviceId: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ status: 'starting', devices: [] });
  // 変えると開き直す（バックグラウンドから戻ったとき等）
  const [generation, setGeneration] = useState(0);
  const restart = useCallback(() => setGeneration((g) => g + 1), []);

  useEffect(() => {
    if (!window.isSecureContext) {
      setState({ status: 'error', error: 'insecure', devices: [] });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: 'error', error: 'unsupported', devices: [] });
      return;
    }

    let cancelled = false;
    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    (async () => {
      // 端末によっては前のストリームを止めないと別のカメラを開けない
      stop();
      setState((s) => ({ ...s, status: 'starting', error: undefined }));
      try {
        const stream = await openStream(deviceId);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        const settings = stream.getVideoTracks()[0]?.getSettings() ?? {};
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === 'videoinput',
        );
        if (cancelled) return;
        setState({
          status: 'ready',
          devices,
          activeDeviceId: settings.deviceId,
          facingMode: settings.facingMode,
        });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, status: 'error', error: errorKind(e) }));
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [deviceId, generation]);

  // ホーム画面アプリはバックグラウンドから戻ると映像が止まっていることがあるので開き直す
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track || track.readyState === 'ended' || videoRef.current?.paused) restart();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [restart]);

  return { videoRef, ...state, restart };
}

export const CAMERA_ERROR_MESSAGES: Record<CameraErrorKind, string> = {
  insecure: 'カメラは HTTPS で開いたページでのみ使えます。',
  unsupported:
    'このブラウザはカメラに対応していません。Safari または Chrome の最新版をお使いください。',
  denied:
    'カメラの使用が許可されていません。端末の設定、またはブラウザのサイト設定からカメラを許可してください。',
  notfound: '使えるカメラが見つかりませんでした。',
  inuse: 'カメラを開けませんでした。ほかのアプリがカメラを使っていないか確認してください。',
  unknown: 'カメラを開けませんでした。',
};
