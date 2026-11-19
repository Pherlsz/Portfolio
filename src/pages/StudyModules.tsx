import { useRef, useState } from 'react';
import { Check, Code2, Copy, Layers, Move, RotateCcw } from 'lucide-react';
import type {
  CanvasBlockData,
  CanvasNode,
  CodePreviewBlockData,
  ContentSegment,
  SpecTabsBlockData
} from '../content/collections';

function InteractiveCanvasBlock({ data }: { data: CanvasBlockData }) {
  const [nodes, setNodes] = useState<CanvasNode[]>(() => data.nodes.map((node) => ({ ...node })));
  const [selectedId, setSelectedId] = useState<string | null>(data.nodes[0]?.id ?? null);
  const draggingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0] ?? null;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, node: CanvasNode) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(node.id);
    draggingRef.current = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = draggingRef.current;
    if (!drag) return;
    const hostWidth = Math.max(hostRef.current?.clientWidth ?? 820, 820);
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const nextX = Math.max(12, Math.min(Math.max(12, hostWidth - 196), drag.originX + dx));
    const nextY = Math.max(12, Math.min(236, drag.originY + dy));
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
    const hostWidth = Math.max(hostRef.current?.clientWidth ?? 820, 820);
    setNodes((prev) =>
      prev.map((item) =>
        item.id === node.id
          ? {
              ...item,
              x: Math.max(12, Math.min(Math.max(12, hostWidth - 196), item.x + dx)),
              y: Math.max(12, Math.min(236, item.y + dy))
            }
          : item
      )
    );
  };

  return (
    <div className="surface-card my-7 overflow-hidden rounded-card">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-surface-soft px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Move className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate font-mono text-ui font-semibold text-ink">{data.title}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-micro text-muted">Arraste ou use setas</span>
          <button
            type="button"
            onClick={() => setNodes(data.nodes.map((node) => ({ ...node })))}
            className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1 font-mono text-micro font-medium text-ink-soft transition-colors duration-150 hover:border-border-strong hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>Resetar</span>
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div
          ref={hostRef}
          className="dot-canvas relative h-80 w-full overflow-x-auto rounded-inner border border-border bg-canvas select-none"
        >
          <div className="relative h-full min-w-[820px]">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {data.edges.map((edge, idx) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;
                const x1 = from.x + 176;
                const y1 = from.y + 34;
                const x2 = to.x;
                const y2 = to.y + 34;
                const cx = (x1 + x2) / 2;
                return (
                  <path
                    key={`${edge.from}-${edge.to}-${idx}`}
                    d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              const isSelected = node.id === selectedNode?.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => onNodeKeyDown(event, node)}
                  onPointerDown={(event) => onPointerDown(event, node)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                  className={`focus-ring absolute top-0 left-0 w-44 cursor-grab rounded-inner border px-3.5 py-2.5 text-left shadow-card transition-colors duration-150 active:cursor-grabbing ${
                    isSelected
                      ? 'border-accent bg-surface ring-1 ring-accent'
                      : 'border-border bg-surface hover:border-border-strong'
                  }`}
                >
                  <p className="font-mono text-ui font-semibold text-ink">{node.label}</p>
                  {node.detail ? (
                    <p className="mt-1 line-clamp-2 text-micro text-muted">{node.detail}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedNode ? (
        <div className="border-t border-border bg-surface-soft px-4 py-3 text-ui text-ink-soft">
          <span className="font-mono font-semibold text-ink">{selectedNode.label}</span>
          <span className="mx-1.5 text-muted" aria-hidden="true">
            ·
          </span>
          <span>{selectedNode.detail ?? 'Etapa do fluxo.'}</span>
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
