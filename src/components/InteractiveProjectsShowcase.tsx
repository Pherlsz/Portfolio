import React, { useState } from 'react';
import { ProjectItem } from '../data/portfolioData';
import { ArrowUpRight, Code2, Cpu, Eye } from 'lucide-react';

interface InteractiveProjectsShowcaseProps {
  projects: ProjectItem[];
  highlightedTech: string | null;
  onSelectProjectLightbox: (project: ProjectItem) => void;
}

export const InteractiveProjectsShowcase: React.FC<InteractiveProjectsShowcaseProps> = ({
  projects,
  highlightedTech,
  onSelectProjectLightbox
}) => {
  const [viewModes, setViewModes] = useState<Record<string, 'visual' | 'blueprint' | 'code'>>({
    'proj-1': 'visual',
    'proj-2': 'visual',
    'proj-3': 'visual'
  });

  const [selectedNodeIdx, setSelectedNodeIdx] = useState<Record<string, number>>({
    'proj-1': 0,
    'proj-2': 0,
    'proj-3': 0
  });

  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const setProjectMode = (id: string, mode: 'visual' | 'blueprint' | 'code') => {
    setViewModes((prev) => ({ ...prev, [id]: mode }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {projects.map((project) => {
        const mode = viewModes[project.id] || 'visual';
        const activeNodeIndex = selectedNodeIdx[project.id] ?? 0;
        const activeNode = project.blueprintNodes[activeNodeIndex] || project.blueprintNodes[0];
        const isTechMatched =
          highlightedTech &&
          project.stack.some((t) => t.toLowerCase() === highlightedTech.toLowerCase());

        return (
          <article
            key={project.id}
            className={`group rounded-2xl border transition-all duration-200 bg-[var(--bg-surface)] overflow-hidden flex flex-col justify-between ${
              isTechMatched
                ? 'border-[#E11D48] ring-1 ring-[#E11D48]/30'
                : 'border-[var(--border-subtle)] hover:border-zinc-500/60'
            }`}
          >
            {/* Compact Top Interactive Stage (h-48) */}
            <div className="h-48 bg-zinc-950 border-b border-[var(--border-subtle)] relative flex flex-col justify-between overflow-hidden">
              {/* Compact Mode Switcher */}
              <div className="relative z-20 flex items-center justify-between gap-1 px-3 py-2 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setProjectMode(project.id, 'visual')}
                    className={`min-h-[28px] px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      mode === 'visual'
                        ? 'bg-[#E11D48] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectMode(project.id, 'blueprint')}
                    className={`min-h-[28px] px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      mode === 'blueprint'
                        ? 'bg-[#E11D48] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />
                    Nodes
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectMode(project.id, 'code')}
                    className={`min-h-[28px] px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                      mode === 'code'
                        ? 'bg-[#E11D48] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    TS
                  </button>
                </div>

                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                  {project.year}
                </span>
              </div>

              {/* STAGE 1: COMPACT IMAGE PREVIEW */}
              {mode === 'visual' && (
                <div
                  onClick={() => onSelectProjectLightbox(project)}
                  className="relative flex-1 cursor-pointer overflow-hidden"
                >
                  {!brokenImages[project.id] ? (
                    <img
                      src={project.image}
                      alt={project.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [project.id]: true }))
                      }
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-zinc-400 font-mono text-xs">
                      {project.title}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-200">
                    <span className="truncate">{project.role}</span>
                    <span className="text-zinc-300 shrink-0 ml-2">Ampliar ↗</span>
                  </div>
                </div>
              )}

              {/* STAGE 2: COMPACT INTERACTIVE BLUEPRINT NODES */}
              {mode === 'blueprint' && (
                <div className="flex-1 p-3 flex flex-col justify-between bg-[#08080B] text-zinc-100">
                  <div className="grid grid-cols-3 gap-1.5">
                    {project.blueprintNodes.map((node, nIdx) => {
                      const isSelected = activeNodeIndex === nIdx;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() =>
                            setSelectedNodeIdx((prev) => ({ ...prev, [project.id]: nIdx }))
                          }
                          className={`p-2 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-zinc-900 border-[#E11D48] text-white'
                              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold truncate">
                            {node.label}
                          </div>
                          <div className="text-[9px] font-mono text-[#E11D48] truncate mt-0.5 tabular-nums">
                            {node.latencyOrStat}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2 pt-1.5">
                    {activeNode.detail}
                  </p>
                </div>
              )}

              {/* STAGE 3: COMPACT CODE VIEW */}
              {mode === 'code' && (
                <div className="flex-1 p-3 bg-[#08080B] flex items-center overflow-x-auto">
                  <pre className="font-mono text-[10px] leading-relaxed text-emerald-400">
                    {project.codeSnippet}
                  </pre>
                </div>
              )}
            </div>

            {/* Compact Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                  {project.index} · {project.kicker}
                </div>

                <h3
                  onClick={() => onSelectProjectLightbox(project)}
                  className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[#E11D48] transition-colors cursor-pointer"
                >
                  {project.title}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                  {project.summary}
                </p>

                {project.metrics[0] && (
                  <div className="pt-1 text-xs font-mono text-[var(--text-primary)] flex items-start gap-1.5">
                    <span className="text-[#E11D48] font-bold">✓</span>
                    <span className="line-clamp-1">{project.metrics[0]}</span>
                  </div>
                )}
              </div>

              {/* Footer: Unboxed Stack + Open Modal Button */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-mono text-[var(--text-muted)] truncate">
                  {project.stack.slice(0, 4).map((tech, tIdx) => {
                    const isHighlighted =
                      highlightedTech && tech.toLowerCase() === highlightedTech.toLowerCase();
                    return (
                      <React.Fragment key={tech}>
                        <span
                          className={
                            isHighlighted
                              ? 'text-[#E11D48] font-bold underline underline-offset-4'
                              : 'text-[var(--text-secondary)]'
                          }
                        >
                          {tech}
                        </span>
                        {tIdx < Math.min(project.stack.length, 4) - 1 && (
                          <span aria-hidden="true">·</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProjectLightbox(project)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--text-primary)] hover:text-[#E11D48] transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Detalhes</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
