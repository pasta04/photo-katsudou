import { Download, RotateCcw, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { canShareFile, downloadFile, isIOS, shareFile } from '../lib/platform';

interface Props {
  photo: File;
  onClose: () => void;
}

/** 撮影した写真の確認。保存・共有・撮り直し */
export function PhotoPreview({ photo, onClose }: Props) {
  const url = useBlobUrl(photo);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const shareable = canShareFile(photo);

  const save = async () => {
    try {
      // iOS はダウンロードしても写真アプリに入らないため、共有シートの「画像を保存」を使う
      if (isIOS() && shareable) {
        setMessage('共有メニューの「画像を保存」を選ぶと写真アプリに保存されます。');
        if ((await shareFile(photo)) === 'shared') setSaved(true);
      } else {
        downloadFile(photo);
        setSaved(true);
        setMessage('保存しました。');
      }
    } catch (e) {
      setMessage(`保存できませんでした: ${e instanceof Error ? e.message : e}`);
    }
  };

  const share = async () => {
    try {
      if ((await shareFile(photo)) === 'shared') setSaved(true);
    } catch (e) {
      setMessage(`共有できませんでした: ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div className="photo-preview">
      <div className="photo-preview-image">{url && <img src={url} alt="撮影した写真" />}</div>
      {message && <p className="photo-preview-message">{message}</p>}
      <div className="photo-preview-actions">
        <button className="button" onClick={onClose}>
          <RotateCcw />
          {saved ? 'カメラに戻る' : '撮り直す'}
        </button>
        {shareable && (
          <button className="button" onClick={share}>
            <Share2 />
            共有
          </button>
        )}
        <button className="button primary" onClick={save}>
          <Download />
          保存
        </button>
      </div>
    </div>
  );
}
