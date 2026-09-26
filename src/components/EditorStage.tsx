import type Konva from 'konva';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KImage, Layer as KLayer, Line, Stage, Transformer } from 'react-konva';
import { useElementSize } from '../hooks/useElementSize';
import { containRect, layerBox, type Rect } from '../lib/layout';
import { getTheme } from '../lib/theme';
import { useSettings } from '../store/settings';
import type { Frame, Layer } from '../types';
import { CameraBackground } from './CameraBackground';

/** フレームの周囲に空ける余白（px）。ハンドルを掴みやすくするため */
const MARGIN = 24;
/** 中央へ吸着する距離（px） */
const SNAP = 8;

interface Props {
  frame: Frame;
  images: ReadonlyMap<string, HTMLImageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** coalesce を渡すと、同じキーの連続変更は Undo 1 回分にまとめられる */
  onChangeLayer: (id: string, patch: Partial<Layer>, coalesce?: string) => void;
  showCamera: boolean;
}

export function EditorStage(props: Props) {
  const { frame, images, selectedId, onSelect, onChangeLayer, showCamera } = props;
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const accent = getTheme(useSettings((s) => s.theme)).colors.accent;
  const rect: Rect = useMemo(() => {
    const r = containRect(
      Math.max(1, size.width - MARGIN * 2),
      Math.max(1, size.height - MARGIN * 2),
      frame.aspect,
    );
    return { ...r, x: r.x + MARGIN, y: r.y + MARGIN };
  }, [size, frame.aspect]);

  const nodes = useRef(new Map<string, Konva.Image>());
  const transformerRef = useRef<Konva.Transformer>(null);
  const [guides, setGuides] = useState({ x: false, y: false });

  const selected = frame.layers.find((l) => l.id === selectedId);
  const selectable = selected && !selected.locked && selected.visible;

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const node = selectable && selectedId ? nodes.current.get(selectedId) : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectable, selectedId, frame.layers, images]);

  /** ノードの現在の見た目をレイヤーの割合座標に書き戻す */
  const commitNode = (layer: Layer, node: Konva.Image, coalesce?: string) => {
    const width = node.width() * Math.abs(node.scaleX());
    // Transformer が変えた拡大率は width に反映し、反転の符号だけ残す
    node.scale({ x: layer.flipX ? -1 : 1, y: layer.flipY ? -1 : 1 });
    onChangeLayer(
      layer.id,
      {
        cx: node.x() / rect.width,
        cy: node.y() / rect.height,
        width: width / rect.width,
        rotation: ((node.rotation() % 360) + 360) % 360,
      },
      coalesce,
    );
  };

  const onDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const snapX = Math.abs(node.x() - rect.width / 2) < SNAP;
    const snapY = Math.abs(node.y() - rect.height / 2) < SNAP;
    if (snapX) node.x(rect.width / 2);
    if (snapY) node.y(rect.height / 2);
    if (snapX !== guides.x || snapY !== guides.y) setGuides({ x: snapX, y: snapY });
  };

  const pinch = usePinch(selectable ? selected : undefined, rect, onChangeLayer, nodes);

  return (
    <div className="editor-stage" ref={containerRef}>
      <div
        className="editor-frame-bg checker"
        style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      >
        {showCamera && <CameraBackground />}
      </div>
      {size.width > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          onPointerDown={(e) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
          onTouchStart={pinch.onTouchStart}
          onTouchMove={pinch.onTouchMove}
          onTouchEnd={pinch.onTouchEnd}
        >
          <KLayer>
            <Group
              x={rect.x}
              y={rect.y}
              clipX={0}
              clipY={0}
              clipWidth={rect.width}
              clipHeight={rect.height}
            >
              {frame.layers.map((layer) => {
                const img = images.get(layer.assetId);
                if (!img) return null;
                const box = layerBox(
                  layer,
                  { width: img.naturalWidth, height: img.naturalHeight },
                  rect.width,
                  rect.height,
                );
                const interactive = !layer.locked;
                return (
                  <KImage
                    key={layer.id}
                    ref={(node) => {
                      if (node) nodes.current.set(layer.id, node);
                      else nodes.current.delete(layer.id);
                    }}
                    image={img}
                    x={box.cx}
                    y={box.cy}
                    width={box.width}
                    height={box.height}
                    offsetX={box.width / 2}
                    offsetY={box.height / 2}
                    rotation={layer.rotation}
                    scaleX={layer.flipX ? -1 : 1}
                    scaleY={layer.flipY ? -1 : 1}
                    opacity={layer.opacity}
                    visible={layer.visible}
                    // ロック中のレイヤーはタップを素通りさせ、下のレイヤーを掴めるようにする
                    listening={interactive}
                    draggable={interactive}
                    onPointerDown={() => onSelect(layer.id)}
                    onDragMove={onDragMove}
                    onDragEnd={(e) => {
                      setGuides({ x: false, y: false });
                      commitNode(layer, e.target as Konva.Image);
                    }}
                    onTransformEnd={(e) => commitNode(layer, e.target as Konva.Image)}
                  />
                );
              })}
            </Group>
            <Group x={rect.x} y={rect.y} listening={false}>
              {guides.x && (
                <Line
                  points={[rect.width / 2, 0, rect.width / 2, rect.height]}
                  stroke={accent}
                  dash={[6, 4]}
                />
              )}
              {guides.y && (
                <Line
                  points={[0, rect.height / 2, rect.width, rect.height / 2]}
                  stroke={accent}
                  dash={[6, 4]}
                />
              )}
            </Group>
            <Transformer
              ref={transformerRef}
              keepRatio
              flipEnabled={false}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              anchorSize={18}
              anchorCornerRadius={9}
              anchorStroke={accent}
              borderStroke={accent}
              rotateAnchorOffset={36}
              rotationSnaps={[0, 90, 180, 270]}
              rotationSnapTolerance={5}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 16 ? oldBox : newBox)}
            />
          </KLayer>
        </Stage>
      )}
    </div>
  );
}

/** 2 本指のピンチで選択中レイヤーを拡大縮小・回転・移動する */
function usePinch(
  layer: Layer | undefined,
  rect: Rect,
  onChangeLayer: Props['onChangeLayer'],
  nodes: RefObject<Map<string, Konva.Image>>,
) {
  const start = useRef<{
    distance: number;
    angle: number;
    mid: { x: number; y: number };
    layer: Layer;
    key: string;
  } | null>(null);

  const measure = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const [a, b] = [e.evt.touches[0], e.evt.touches[1]];
    return {
      distance: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
      angle: (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180) / Math.PI,
      mid: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
    };
  };

  return {
    onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (!layer || e.evt.touches.length !== 2) return;
      // 1 本目の指で始まったドラッグはピンチに切り替える
      nodes.current.get(layer.id)?.stopDrag();
      start.current = { ...measure(e), layer, key: `pinch:${Date.now()}` };
    },
    onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => {
      const s = start.current;
      if (!s || e.evt.touches.length !== 2) return;
      e.evt.preventDefault();
      const m = measure(e);
      onChangeLayer(
        s.layer.id,
        {
          width: Math.max(0.02, (s.layer.width * m.distance) / s.distance),
          rotation: (((s.layer.rotation + m.angle - s.angle) % 360) + 360) % 360,
          cx: s.layer.cx + (m.mid.x - s.mid.x) / rect.width,
          cy: s.layer.cy + (m.mid.y - s.mid.y) / rect.height,
        },
        s.key,
      );
    },
    onTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length < 2) start.current = null;
    },
  };
}
