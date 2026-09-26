import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'currentColor',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

/** 左右反転。中央の縦線を挟んで、両側から線に向く三角形（Clip Studio などと同じ表記） */
export function FlipHorizontalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18" fill="none" />
      <path d="M3 7v10l6-5z" />
      <path d="M21 7v10l-6-5z" />
    </svg>
  );
}

/** 上下反転。中央の横線を挟んで、上下から線に向く三角形 */
export function FlipVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h18" fill="none" />
      <path d="M7 3h10l-5 6z" />
      <path d="M7 21h10l-5-6z" />
    </svg>
  );
}
