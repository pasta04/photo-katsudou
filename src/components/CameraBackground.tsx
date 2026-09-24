import { useCamera } from '../hooks/useCamera';
import { useSettings } from '../store/settings';

/** フレーム編集時の背景にカメラ映像を映す（見え方の確認用） */
export function CameraBackground() {
  const deviceId = useSettings((s) => s.lastDeviceId);
  const { videoRef, facingMode } = useCamera(deviceId);
  return (
    <video
      ref={videoRef}
      className={`camera-video${facingMode === 'user' ? ' mirrored' : ''}`}
      playsInline
      muted
      autoPlay
    />
  );
}
