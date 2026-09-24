import { useEffect, useState } from 'react';

/** Blob を <img src> で表示するための object URL。不要になったら自動で解放する */
export function useBlobUrl(blob: Blob | undefined | null): string | undefined {
  const [entry, setEntry] = useState<{ blob: Blob; url: string }>();

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // object URL は作成と解放を対にする必要があるため effect 内で作る
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntry({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return blob && entry?.blob === blob ? entry.url : undefined;
}
