import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Frame as FrameIcon, Grid3x3, SwitchCamera, Timer } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '../components/Dialog';
import { FrameOverlay } from '../components/FrameOverlay';
import { FrameThumb } from '../components/FrameThumb';
import { PhotoPreview } from '../components/PhotoPreview';
import { db } from '../db/db';
import { useAssetImages } from '../hooks/useAssetImages';
import { CAMERA_ERROR_MESSAGES, useCamera } from '../hooks/useCamera';
import { useElementSize } from '../hooks/useElementSize';
import { useWakeLock } from '../hooks/useWakeLock';
import { containRect, isPortrait } from '../lib/layout';
import { canvasToBlob, composePhoto } from '../lib/render';
import { useSettings } from '../store/settings';
import type { Aspect, Frame } from '../types';

/** フレームを使わないときの比率 */
const NO_FRAME_ASPECT: Aspect = { w: 3, h: 4 };
const TIMER_OPTIONS = [0, 3, 10];

export function CameraPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const frames = useLiveQuery(() => db.frames.orderBy('updatedAt').reverse().toArray(), []);
  const frame = frames?.find((f) => f.id === settings.lastFrameId) ?? null;
  const aspect = frame?.aspect ?? NO_FRAME_ASPECT;
  const layers = frame?.layers ?? [];
  const images = useAssetImages(layers);

  const { videoRef, ...camera } = useCamera(settings.lastDeviceId);
  const front = camera.facingMode === 'user';
  useWakeLock();

  const [viewportRef, viewport] = useElementSize<HTMLDivElement>();
  const rect = containRect(Math.max(1, viewport.width), Math.max(1, viewport.height), aspect);
  const orientationMismatch =
    aspect.w !== aspect.h && isPortrait(aspect) !== viewport.height > viewport.width;

  const [photo, setPhoto] = useState<File | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [flash, setFlash] = useState(false);
  const [pickingFrame, setPickingFrame] = useState(false);
  const [pickingCamera, setPickingCamera] = useState(false);

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    navigator.vibrate?.(30);

    const canvas = composePhoto({
      video,
      aspect,
      layers,
      images,
      mirror: front && settings.mirrorFrontCamera,
    });
    const png = settings.photoFormat === 'png';
    const blob = await canvasToBlob(canvas, png ? 'image/png' : 'image/jpeg', settings.jpegQuality);
    setPhoto(new File([blob], photoFileName(frame, png ? 'png' : 'jpg'), { type: blob.type }));
  };

  const shutter = () => {
    if (countdown > 0 || camera.status !== 'ready') return;
    if (!settings.timerSeconds) {
      takePhoto();
      return;
    }
    let remaining = settings.timerSeconds;
    setCountdown(remaining);
    const timer = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        takePhoto();
      }
    }, 1000);
  };

  const switchCamera = () => {
    if (camera.devices.length > 2) {
      setPickingCamera(true);
      return;
    }
    const others = camera.devices.filter((d) => d.deviceId !== camera.activeDeviceId);
    if (others[0]) settings.set({ lastDeviceId: others[0].deviceId });
  };

  const cycleTimer = () => {
    const i = TIMER_OPTIONS.indexOf(settings.timerSeconds);
    settings.set({ timerSeconds: TIMER_OPTIONS[(i + 1) % TIMER_OPTIONS.length] });
  };

  return (
    <div className="camera">
      <div className="camera-viewport" ref={viewportRef}>
        <div
          className="camera-frame"
          style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
        >
          <video
            ref={videoRef}
            className={`camera-video${front ? ' mirrored' : ''}`}
            playsInline
            muted
            autoPlay
          />
          <FrameOverlay layers={layers} images={images} width={rect.width} height={rect.height} />
          {settings.showGrid && <div className="camera-grid" />}
          {countdown > 0 && <div className="countdown">{countdown}</div>}
          {flash && <div className="flash" />}
        </div>
        {camera.status === 'error' && camera.error && (
          <div className="camera-error">
            <p>{CAMERA_ERROR_MESSAGES[camera.error]}</p>
            <button className="button primary" onClick={camera.restart}>
              もう一度試す
            </button>
            <Link to="/guide" className="button">
              使い方を見る
            </Link>
          </div>
        )}
        {orientationMismatch && camera.status === 'ready' && (
          <p className="camera-hint">端末を回転すると大きく表示されます</p>
        )}
      </div>

      <div className="camera-controls">
        <div className="camera-controls-group">
          <button className="icon-button" onClick={() => navigate('/')} aria-label="ホームへ戻る">
            <ArrowLeft />
          </button>
          <button
            className={`icon-button${settings.showGrid ? ' active' : ''}`}
            onClick={() => settings.set({ showGrid: !settings.showGrid })}
            aria-label="グリッド線"
          >
            <Grid3x3 />
          </button>
          <button
            className={`icon-button timer-button${settings.timerSeconds ? ' active' : ''}`}
            onClick={cycleTimer}
            aria-label="セルフタイマー"
          >
            <Timer />
            {settings.timerSeconds > 0 && <span>{settings.timerSeconds}</span>}
          </button>
        </div>
        <button
          className="shutter"
          onClick={shutter}
          disabled={camera.status !== 'ready'}
          aria-label="シャッター"
        />
        <div className="camera-controls-group">
          <button
            className="frame-button"
            onClick={() => setPickingFrame(true)}
            aria-label="フレームを選ぶ"
          >
            {frame ? <FrameThumb frame={frame} /> : <FrameIcon />}
          </button>
          <button
            className="icon-button"
            onClick={switchCamera}
            disabled={camera.devices.length < 2}
            aria-label="カメラを切り替え"
          >
            <SwitchCamera />
          </button>
        </div>
      </div>

      {pickingFrame && (
        <Dialog title="フレームを選ぶ" onClose={() => setPickingFrame(false)} sheet>
          <ul className="frame-picker">
            <li>
              <button
                className={`frame-picker-item${frame ? '' : ' selected'}`}
                onClick={() => {
                  settings.set({ lastFrameId: null });
                  setPickingFrame(false);
                }}
              >
                <span className="thumb none">なし</span>
                <span>フレームなし</span>
              </button>
            </li>
            {frames?.map((f) => (
              <li key={f.id}>
                <button
                  className={`frame-picker-item${f.id === frame?.id ? ' selected' : ''}`}
                  onClick={() => {
                    settings.set({ lastFrameId: f.id });
                    setPickingFrame(false);
                  }}
                >
                  <FrameThumb frame={f} />
                  <span>{f.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/frames" className="button">
            フレームを編集する
          </Link>
        </Dialog>
      )}

      {pickingCamera && (
        <Dialog title="カメラを選ぶ" onClose={() => setPickingCamera(false)} sheet>
          <ul className="camera-list">
            {camera.devices.map((d, i) => (
              <li key={d.deviceId}>
                <button
                  className={`button${d.deviceId === camera.activeDeviceId ? ' primary' : ''}`}
                  onClick={() => {
                    settings.set({ lastDeviceId: d.deviceId });
                    setPickingCamera(false);
                  }}
                >
                  {d.label || `カメラ ${i + 1}`}
                </button>
              </li>
            ))}
          </ul>
        </Dialog>
      )}

      {photo && <PhotoPreview photo={photo} onClose={() => setPhoto(null)} />}
    </div>
  );
}

function photoFileName(frame: Frame | null, ext: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const name = frame ? `_${frame.name.replace(/[\\/:*?"<>|\s]+/g, '_')}` : '';
  return `photo-katsudou${name}_${stamp}.${ext}`;
}
