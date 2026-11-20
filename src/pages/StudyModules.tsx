import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  Check,
  Code2,
  Copy,
  GripVertical,
  Layers,
  Move,
  RotateCcw
} from 'lucide-react';
import type {
  CanvasBlockData,
  CanvasNode,
  CodePreviewBlockData,
  ContentSegment,
  SpecTabsBlockData
} from '../content/collections';

const STAGE_W = 860;
const STAGE_H = 324;
const DEFAULT_NODE_W = 224;
const DEFAULT_NODE_H = 96;
const STAGE_PADDING = 16;

interface NodeSize {
  w: number;
  h: number;
}

interface EdgeGeometry {
  d: string;
  mx: number;
  my: number;
}

function computeEdgeGeometry(
  from: CanvasNode,
  to: CanvasNode,
  fromSize: NodeSize,
  toSize: NodeSize
): EdgeGeometry {
  const fromCx = from.x + fromSize.w / 2;
  const fromCy = from.y + fromSize.h / 2;
  const toCx = to.x + toSize.w / 2;
  const toCy = to.y + toSize.h / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;

  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;
  let cp1x: number;
  let cp1y: number;
  let cp2x: number;
  let cp2y: number;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const forward = dx >= 0;
    x1 = forward ? from.x + fromSize.w : from.x;
    y1 = fromCy;
    x2 = forward ? to.x - 7 : to.x + toSize.w + 7;
    y2 = toCy;
    const c = Math.max(32, Math.abs(x2 - x1) * 0.45);
    cp1x = forward ? x1 + c : x1 - c;
    cp1y = y1;
    cp2x = forward ? x2 - c : x2 + c;
    cp2y = y2;
  } else {
    const downward = dy >= 0;
    x1 = fromCx;
    y1 = downward ? from.y + fromSize.h : from.y;
    x2 = toCx;
    y2 = downward ? to.y - 7 : to.y + toSize.h + 7;
    const c = Math.max(24, Math.abs(y2 - y1) * 0.45);
    cp1x = x1;
    cp1y = downward ? y1 + c : y1 - c;
    cp2x = x2;
    cp2y = downward ? y2 - c : y2 + c;
  }

  return {
    d: `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`,
    mx: 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2,
    my: 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2
  };
}

function InteractiveCanvasBlock({ data }: { data: CanvasBlockData }) {
  const [nodes, setNodes] = useState<CanvasNode[]>(() => data.nodes.map((node) => ({ ...node })));
  const [selectedId, setSelectedId] = useState<string | null>(data.nodes[0]?.id ?? null);
  const [nodeSizes, setNodeSizes] = useState<Record<string, NodeSize>>({});
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const draggingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    maxX: number;
    maxY: number;
  } | null>(null);
  const markerUid = useId().replace(/:/g, '');
  const mutedMarkerId = `canvas-arrow-muted-${markerUid}`;
  const activeMarkerId = `canvas-arrow-active-${markerUid}`;

  useLayoutEffect(() => {
    const measureAll = () => {
      const next: Record<string, NodeSize> = {};
      nodeRefs.current.forEach((el, id) => {
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          next[id] = { w: el.offsetWidth, h: el.offsetHeight };
        }
      });
      setNodeSizes((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (
          prevKeys.length === nextKeys.length &&
          nextKeys.every((k) => prev[k]?.w === next[k].w && prev[k]?.h === next[k].h)
        ) {
          return prev;
        }
        return next;
      });
    };

    measureAll();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measureAll);
    nodeRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [nodes.length]);

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0] ?? null;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const isDirty = nodes.some((node, idx) => {
    const original = data.nodes[idx];
    return !original || node.x !== original.x || node.y !== original.y;
  });

  const clampPosition = (id: string, rawX: number, rawY: number) => {
    const size = nodeSizes[id] ?? { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
    const maxX = Math.max(STAGE_PADDING, STAGE_W - size.w - STAGE_PADDING);
    const maxY = Math.max(STAGE_PADDING, STAGE_H - size.h - STAGE_PADDING);
    return {
      x: Math.max(STAGE_PADDING, Math.min(maxX, rawX)),
      y: Math.max(STAGE_PADDING, Math.min(maxY, rawY))
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, node: CanvasNode) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(node.id);
    const size = nodeSizes[node.id] ?? { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
    draggingRef.current = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y,
      maxX: Math.max(STAGE_PADDING, STAGE_W - size.w - STAGE_PADDING),
      maxY: Math.max(STAGE_PADDING, STAGE_H - size.h - STAGE_PADDING)
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = draggingRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const nextX = Math.max(STAGE_PADDING, Math.min(drag.maxX, drag.originX + dx));
    const nextY = Math.max(STAGE_PADDING, Math.min(drag.maxY, drag.originY + dy));
    setNodes((prev) =>
      prev.map((item) => (item.id === drag.id ? { ...item, x: nextX, y: nextY } : item))
    );
  };

  const onPointerUp = () => {
    draggingRef.current = null;
  };

  const onNodeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, node: CanvasNode) => {
    const step = event.shiftKey ? 32 : 16;
    let dx = 0;
    let dy = 0;
    if (event.key === 'ArrowLeft') dx = -step;
    else if (event.key === 'ArrowRight') dx = step;
    else if (event.key === 'ArrowUp') dy = -step;
    else if (event.key === 'ArrowDown') dy = step;
    else return;

    event.preventDefault();
    setSelectedId(node.id);
    const next = clampPosition(node.id, node.x + dx, node.y + dy);
    setNodes((prev) =>
      prev.map((item) => (item.id === node.id ? { ...item, x: next.x, y: next.y } : item))
    );
  };

  const incomingNodes = selectedNode
    ? data.edges
        .filter((edge) => edge.to === selectedNode.id)
        .map((edge) => nodeMap.get(edge.from))
        .filter((item): item is CanvasNode => Boolean(item))
    : [];

  const outgoingNodes = selectedNode
    ? data.edges
        .filter((edge) => edge.from === selectedNode.id)
        .map((edge) => nodeMap.get(edge.to))
        .filter((item): item is CanvasNode => Boolean(item))
    : [];

  return (
    <div className="surface-card my-7 overflow-hidden rounded-card">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-surface-soft px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Move className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate font-mono text-ui font-semibold text-ink">{data.title}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden font-mono text-micro text-muted md:inline">
            Clique ou arraste as etapas
          </span>
          <span className="font-mono text-micro text-muted md:hidden">
            Toque em uma etapa
          </span>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => setNodes(data.nodes.map((node) => ({ ...node })))}
            className="focus-ring pill-button hidden min-h-8 bg-surface px-3 py-1 font-mono text-micro md:inline-flex"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>Resetar</span>
          </button>
        </div>
      </div>

      <div className="hidden p-4 md:block">
        <div className="dot-canvas overflow-x-auto rounded-inner border border-border bg-canvas select-none">
          <div
            className="relative mx-auto"
            style={{ width: STAGE_W, height: STAGE_H }}
          >
            <svg
              aria-hidden="true"
              width={STAGE_W}
              height={STAGE_H}
              viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
              className="pointer-events-none absolute inset-0"
            >
              <defs>
                <marker
                  id={mutedMarkerId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--border-strong)" />
                </marker>
                <marker
                  id={activeMarkerId}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--accent)" />
                </marker>
              </defs>

              {data.edges.map((edge, idx) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;
                const fromSize = nodeSizes[from.id] ?? { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
                const toSize = nodeSizes[to.id] ?? { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
                const geom = computeEdgeGeometry(from, to, fromSize, toSize);
                const isEdgeActive =
                  selectedNode !== null &&
                  (edge.from === selectedNode.id || edge.to === selectedNode.id);

                return (
                  <path
                    key={`${edge.from}-${edge.to}-${idx}`}
                    d={geom.d}
                    fill="none"
                    stroke={isEdgeActive ? 'var(--accent)' : 'var(--border-strong)'}
                    strokeWidth={isEdgeActive ? 2 : 1.5}
                    strokeDasharray={isEdgeActive ? undefined : '4 4'}
                    markerEnd={`url(#${isEdgeActive ? activeMarkerId : mutedMarkerId})`}
                  />
                );
              })}
            </svg>

            {data.edges.map((edge, idx) => {
              if (!edge.label) return null;
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);
              if (!from || !to) return null;
              const fromSize = nodeSizes[from.id] ?? { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
              const toSize = nodeSizes[to.id] ?? { w: DEFAULT_NODE_W, h: DEFAULT_NODE_H };
              const geom = computeEdgeGeometry(from, to, fromSize, toSize);
              const isEdgeActive =
                selectedNode !== null &&
                (edge.from === selectedNode.id || edge.to === selectedNode.id);

              return (
                <span
                  key={`${edge.from}-${edge.to}-label-${idx}`}
                  aria-hidden="true"
                  style={{ left: geom.mx, top: geom.my }}
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-pill border px-2 py-0.5 font-mono text-micro font-medium transition-colors duration-150 ${
                    isEdgeActive
                      ? 'border-accent bg-surface text-ink'
                      : 'border-border bg-canvas text-muted'
                  }`}
                >
                  {edge.label}
                </span>
              );
            })}

            {nodes.map((node) => {
              const isSelected = node.id === selectedNode?.id;
              return (
                <button
                  key={node.id}
                  ref={(el) => {
                    if (el) nodeRefs.current.set(node.id, el);
                    else nodeRefs.current.delete(node.id);
                  }}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => onNodeKeyDown(event, node)}
                  onPointerDown={(event) => onPointerDown(event, node)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                  className={`focus-ring absolute top-0 left-0 w-56 cursor-grab rounded-inner border bg-surface px-3.5 py-3 text-left shadow-card transition-colors duration-150 active:cursor-grabbing ${
                    isSelected
                      ? 'border-accent ring-1 ring-accent'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {node.tag ? (
                      <span className="font-mono text-micro font-medium text-muted">
                        {node.tag}
                      </span>
                    ) : (
                      <span />
                    )}
                    <GripVertical className="size-3.5 shrink-0 text-muted/70" aria-hidden="true" />
                  </div>
                  <p className="mt-1 font-display text-ui font-bold leading-snug text-ink">
                    {node.label}
                  </p>
                  {node.summary || node.detail ? (
                    <p className="mt-1 line-clamp-2 text-micro leading-snug text-ink-soft">
                      {node.summary ?? node.detail}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 md:hidden">
        <div className="rounded-inner border border-border bg-canvas p-3">
          {nodes.map((node, idx) => {
            const isSelected = node.id === selectedNode?.id;
            const nextNode = nodes[idx + 1];
            const linkingEdge = nextNode
              ? data.edges.find(
                  (edge) =>
                    (edge.from === node.id && edge.to === nextNode.id) ||
                    (edge.from === nextNode.id && edge.to === node.id)
                )
              : undefined;

            return (
              <div key={node.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  className={`focus-ring w-full rounded-inner border bg-surface px-3.5 py-3 text-left shadow-card transition-colors duration-150 ${
                    isSelected
                      ? 'border-accent ring-1 ring-accent'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  {node.tag ? (
                    <span className="font-mono text-micro font-medium text-muted">
                      {node.tag}
                    </span>
                  ) : null}
                  <p className="mt-0.5 font-display text-ui font-bold leading-snug text-ink">
                    {node.label}
                  </p>
                  {node.summary || node.detail ? (
                    <p className="mt-1 text-micro leading-snug text-ink-soft">
                      {node.summary ?? node.detail}
                    </p>
                  ) : null}
                </button>

                {nextNode ? (
                  <div className="my-1.5 flex items-center justify-center gap-1.5 font-mono text-micro text-muted">
                    <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                    {linkingEdge?.label ? (
                      <span className="rounded-pill border border-border bg-surface px-2 py-0.5 text-ink-soft">
                        {linkingEdge.label}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {selectedNode ? (
        <div className="border-t border-border bg-surface-soft px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {selectedNode.tag ? (
              <span className="rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-micro font-medium text-muted">
                {selectedNode.tag}
              </span>
            ) : null}
            <span className="font-display text-body font-bold tracking-tight text-ink">
              {selectedNode.label}
            </span>
          </div>
          <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">
            {selectedNode.detail ?? selectedNode.summary ?? 'Etapa do fluxo.'}
          </p>

          {incomingNodes.length > 0 || outgoingNodes.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-3">
              {incomingNodes.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-micro text-muted">Recebe de:</span>
                  {incomingNodes.map((neighbor) => (
                    <button
                      key={`in-${neighbor.id}`}
                      type="button"
                      onClick={() => setSelectedId(neighbor.id)}
                      className="focus-ring inline-flex min-h-7 cursor-pointer items-center rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-micro text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
                    >
                      {neighbor.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {outgoingNodes.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-micro text-muted">Envia para:</span>
                  {outgoingNodes.map((neighbor) => (
                    <button
                      key={`out-${neighbor.id}`}
                      type="button"
                      onClick={() => setSelectedId(neighbor.id)}
                      className="focus-ring inline-flex min-h-7 cursor-pointer items-center rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-micro text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
                    >
                      {neighbor.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CodePreviewBlock({ data }: { data: CodePreviewBlockData }) {
  const [copied, setCopied] = useState(false);
  const [rowCount, setRowCount] = useState(5000);

  const isVirtualDemo = data.code.includes('useVirtualizer');
  const visibleDomNodes = Math.min(20, Math.max(8, Math.round(rowCount / 280)));

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="surface-card my-7 overflow-hidden rounded-card">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-surface-soft px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Code2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate font-mono text-ui font-semibold text-ink">{data.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-pill border border-border bg-surface px-2.5 py-0.5 font-mono text-micro text-muted">
            {data.language}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1 font-mono text-micro font-medium text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-ok" aria-hidden="true" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <pre className="overflow-x-auto rounded-inner border border-border bg-code-bg p-4 font-mono text-micro leading-relaxed text-code-ink">
          <code>{data.code}</code>
        </pre>

        <div className="flex flex-col justify-between rounded-inner border border-border bg-surface-soft p-4">
          <p className="font-mono text-ui font-semibold text-ink">
            {data.previewLabel ?? 'Simulação'}
          </p>

          {isVirtualDemo ? (
            <div className="mt-4 space-y-3.5">
              <label className="block">
                <span className="flex items-center justify-between font-mono text-micro text-muted">
                  <span>Registros na lista</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {rowCount.toLocaleString('pt-BR')}
                  </span>
                </span>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={500}
                  value={rowCount}
                  onChange={(event) => setRowCount(Number(event.target.value))}
                  style={{ '--fill': `${((rowCount - 500) / 9500) * 100}%` } as React.CSSProperties}
                  className="r-slider mt-2 w-full"
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-control border border-border bg-surface p-3">
                  <p className="font-mono text-micro text-muted">Sem virtualização</p>
                  <p className="mt-1 font-mono text-ui font-bold text-danger tabular-nums">
                    {rowCount.toLocaleString('pt-BR')} nós
                  </p>
                </div>
                <div className="rounded-control border border-border bg-surface p-3">
                  <p className="font-mono text-micro text-muted">Com janela ativa</p>
                  <p className="mt-1 font-mono text-ui font-bold text-ok tabular-nums">
                    ~{visibleDomNodes} nós
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-control border border-border bg-surface p-3.5 text-ui leading-relaxed text-ink-soft">
              Contrato validado pelo TypeScript em tempo de compilação.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecTabsBlock({ data }: { data: SpecTabsBlockData }) {
  const [activeId, setActiveId] = useState(data.tabs[0]?.id ?? '');
  const [copied, setCopied] = useState(false);
  const activeTab = data.tabs.find((tab) => tab.id === activeId) ?? data.tabs[0];

  if (!activeTab) return null;

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(activeTab.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="surface-card my-7 overflow-hidden rounded-card">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-surface-soft px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate font-mono text-ui font-semibold text-ink">{data.title}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label={data.title}
            className="inline-flex flex-wrap items-center gap-1 rounded-pill border border-border bg-surface p-0.5"
          >
            {data.tabs.map((tab) => {
              const selected = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setActiveId(tab.id)}
                  className={`focus-ring min-h-8 rounded-pill px-3 py-1 font-mono text-micro font-medium transition-colors duration-150 ${
                    selected ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={copyContent}
            className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1 font-mono text-micro font-medium text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-ok" aria-hidden="true" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden="true" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div
          role="tabpanel"
          className="rounded-inner border border-border bg-code-bg p-4 text-code-ink"
        >
          {activeTab.language ? (
            <div className="mb-2.5 flex items-center justify-between border-b border-code-ink/10 pb-2 font-mono text-micro text-code-ink/60">
              <span>{activeTab.label}</span>
              <span>{activeTab.language}</span>
            </div>
          ) : null}
          <pre className="overflow-x-auto font-mono text-micro leading-relaxed whitespace-pre-wrap text-code-ink">
            <code>{activeTab.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export function StudyRichSegment({
  segment
}: {
  segment: Exclude<ContentSegment, { type: 'markdown' }>;
}) {
  if (segment.type === 'canvas') {
    return <InteractiveCanvasBlock data={segment.data} />;
  }
  if (segment.type === 'code-preview') {
    return <CodePreviewBlock data={segment.data} />;
  }
  return <SpecTabsBlock data={segment.data} />;
}

export default StudyRichSegment;
