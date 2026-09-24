import { useBlobUrl } from '../hooks/useBlobUrl';
import type { Frame } from '../types';

export function FrameThumb({ frame }: { frame: Frame }) {
  const url = useBlobUrl(frame.thumbnail);
  return (
    <span
      className="thumb checker"
      style={{ aspectRatio: `${frame.aspect.w} / ${frame.aspect.h}` }}
    >
      {url && <img src={url} alt="" draggable={false} />}
    </span>
  );
}
