import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 下部のボタン群 */
  actions?: ReactNode;
  /** 画面下からせり上がるシート表示にする */
  sheet?: boolean;
}

export function Dialog({ title, onClose, children, actions, sheet }: Props) {
  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={sheet ? 'sheet' : 'dialog'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}
