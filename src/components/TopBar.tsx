import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: ReactNode;
  /** 戻る先。省略時はホーム */
  back?: string;
  /** 戻るボタンの処理を差し替える（保存確認を挟むときなど） */
  onBack?: () => void;
  /** 右側のボタン群 */
  children?: ReactNode;
}

export function TopBar({ title, back = '/', onBack, children }: Props) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <button className="icon-button" onClick={onBack ?? (() => navigate(back))} aria-label="戻る">
        <ArrowLeft />
      </button>
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">{children}</div>
    </header>
  );
}
