import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useBlobUrl } from '../hooks/useBlobUrl';
import type { Frame } from '../types';

export function FrameThumb({ frame }: { frame: Frame }) {
  const thumbnail = useLiveQuery(() => db.frameThumbnails.get(frame.id), [frame.id]);
  const url = useBlobUrl(thumbnail?.blob);
  return (
    <span
      className="thumb checker"
      style={{ aspectRatio: `${frame.aspect.w} / ${frame.aspect.h}` }}
    >
      {url && <img src={url} alt="" draggable={false} />}
    </span>
  );
}
