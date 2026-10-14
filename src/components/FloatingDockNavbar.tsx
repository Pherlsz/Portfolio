import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  X,
  Send,
  Sun,
  Moon,
  Sparkles,
  Download,
  FileCode2,
  ArrowUpRight,
  RotateCcw,
  Copy,
  Check,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { PortfolioData, generateLlmsTxt } from '../data/portfolioData';
import { validateUserChatInput } from '../utils/chatGuardrails';

export interface ChatAction {
  label: string;
  type: 'navigate' | 'export_cv' | 'filter_tech' | 'open_inspector';
  value: string;
}

interface FloatingDockNavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  portfolioData: PortfolioData;
  onOpenAiInspector: (initialTab?: 'llms' | 'schema' | 'guardrails') => void;
  onFilterTech?: (tech: string | null) => void;
  externalChatOpen?: boolean;
  onExternalChatClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actions?: ChatAction[];
}

const SUGGESTED_QUESTIONS = [
  'Qual a principal experiência dele?',
  'Resumo executivo para recrutador',
  'Detalhe a arquitetura dos projetos',
  'Qual a stack principal e métricas?',
  'Conte sobre as Gincanas do RS e as 3 gatas'
];

const ROLE_PRESETS = [
  {
    label: 'Senior Frontend (React / TS)',
    prompt:
      'Avalie a aderência técnica do Pedro para uma vaga de Senior Frontend Engineer (React, TypeScript, Performance Web, Design Systems e Mobile-First). Liste os pontos fortes reais dele.'
  },
  {
    label: 'Full-Stack Engineer (Node / TS)',
    prompt:
      'Avalie o fit do Pedro para uma posição Full-Stack trabalhando com TypeScript, React, Node.js, APIs em tempo real (WebSockets) e bancos relacionais.'
  },
  {
    label: 'Product & Creative Engineer',
    prompt:
      'Como o perfil do Pedro combina engenharia de software, micro-interações a 60fps e resolução rápida de problemas para atuar como Product Engineer?'
  }
];

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} className="h-2" />;
    }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const cleanLine = isBullet ? trimmed.slice(2) : line;

    // Parse **bold** and `code`
    const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[11px] text-[#E11D48]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={pIdx}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-1 py-0.5">
          <span className="text-[#E11D48] font-mono text-xs mt-0.5">→</span>
          <span className="flex-1">{renderedParts}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="py-0.5">
        {renderedParts}
      </p>
    );
  });
}

export const FloatingDockNavbar: React.FC<FloatingDockNavbarProps> = ({
  theme,
  onToggleTheme,
  portfolioData,
  onOpenAiInspector,
  onFilterTech,
  externalChatOpen,
  onExternalChatClose
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'jobfit'>('chat');
  const [inputValue, setInputValue] = useState('');
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome',
    role: 'model',
    text: 'Olá! Posso resumir a trajetória do **Pedro Lopes**, detalhar as decisões de arquitetura dos projetos dele, filtrar tecnologias na página ou avaliar a compatibilidade dele com a sua vaga.',
    actions: [
      { label: 'Ver Experiências', type: 'navigate', value: '#experiencias' },
      { label: 'Explorar Projetos', type: 'navigate', value: '#projetos' },
      { label: 'Baixar CV (.MD)', type: 'export_cv', value: 'md' }
    ]
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (externalChatOpen) {
      setChatOpen(true);
      setMenuOpen(false);
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  }, [externalChatOpen]);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen, isLoading]);

  const handleCloseChat = () => {
    setChatOpen(false);
    onExternalChatClose?.();
  };

  const handleExportMarkdownCv = () => {
    const content = generateLlmsTxt(portfolioData);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Pedro_Henriques_Lopes_CV.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteAction = (action: ChatAction) => {
    if (action.type === 'navigate') {
      handleCloseChat();
      const el = document.querySelector(action.value);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (action.type === 'export_cv') {
      handleExportMarkdownCv();
    } else if (action.type === 'filter_tech') {
      onFilterTech?.(action.value);
      handleCloseChat();
      const el = document.querySelector('#experiencias');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (action.type === 'open_inspector') {
      handleCloseChat();
      onOpenAiInspector('llms');
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setChatMode('chat');
    setChatOpen(true);
    setMenuOpen(false);

    // Pre-flight Zod validation on client (also enforced on server)
    const zodCheck = validateUserChatInput(trimmed);
    if (!zodCheck.valid) {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: `**${zodCheck.error}**\n\nRespondo exclusivamente sobre a trajetória profissional, arquitetura de projetos, stack tecnológica e bastidores de **Pedro Henriques Lopes**.`,
          actions: [
            { label: 'Ver Experiências', type: 'navigate', value: '#experiencias' },
            { label: 'Explorar Projetos', type: 'navigate', value: '#projetos' }
          ]
        }
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pergunta.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply,
          actions: data.actions
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: 'Você pode consultar diretamente as seções de **Experiências** e **Projetos** abaixo ou exportar o currículo completo em um clique.',
          actions: [
            { label: 'Ver Experiências', type: 'navigate', value: '#experiencias' },
            { label: 'Baixar CV (.MD)', type: 'export_cv', value: 'md' }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleJobFitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescriptionInput.trim()) return;
    const prompt = `Analise a seguinte descrição de vaga / requisitos e destaque objetivamente como a experiência, projetos e stack do Pedro Lopes se conectam com ela:\n\n"${jobDescriptionInput.trim()}"`;
    setJobDescriptionInput('');
    sendMessage(prompt);
  };

  const navItems = [
    { label: '01. Início & Métricas', href: '#inicio' },
    { label: '02. Experiências & Stack', href: '#experiencias' },
    { label: '03. Projetos & Arquitetura', href: '#projetos' },
    { label: '04. Certificações & Badges', href: '#certificacoes' },
    { label: '05. Sobre Mim & Stickers', href: '#sobre' },
    { label: '06. Exportar CV & Dados IA', href: '#ai-inspector' }
  ];

  return (
    <>
      {/* Backdrop when Menu or Chat Drawer is expanded */}
      {(menuOpen || chatOpen) && (
        <div
          onClick={() => {
            setMenuOpen(false);
            handleCloseChat();
          }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* SINGLE FLOATING TOP NAVBAR */}
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.25rem)] max-w-3xl">
        {/* MAIN FLOATING BAR: [Expand Menu] — [AI Assistant Input] — [Export CV + Theme Toggle] */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl p-1.5 shadow-2xl flex items-center gap-2">
          {/* Left: Brand + Expandable Section Navigation Button */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              if (chatOpen) handleCloseChat();
            }}
            aria-expanded={menuOpen}
            aria-label="Expandir menu de navegação entre seções"
            className={`min-h-[44px] px-3.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              menuOpen
                ? 'bg-[#E11D48] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[#E11D48] border border-[var(--border-subtle)]'
            }`}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Compass className="w-4 h-4 text-[#E11D48]" />}
            <span className="font-display font-bold tracking-tight">Pedro.Lopes</span>
            <span className="hidden md:inline text-[11px] font-mono opacity-70">· Menu</span>
          </button>

          {/* Center: Input that opens and interacts with the Portfolio Assistant */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex items-center min-w-0">
            <div className="relative w-full flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48] absolute left-3.5 pointer-events-none" />
              <input
                ref={chatInputRef}
                type="text"
                value={inputValue}
                onFocus={() => {
                  setChatOpen(true);
                  setMenuOpen(false);
                }}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte sobre experiências, stack, projetos ou avalie fit..."
                aria-label="Perguntar sobre Pedro Lopes"
                className="w-full min-h-[44px] pl-9 pr-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[#E11D48] focus:outline-none text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Enviar pergunta"
                className="absolute right-1.5 min-h-[34px] min-w-[34px] rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[#E11D48] disabled:opacity-35 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Right: Export CV Button + Theme Toggle Button */}
          <button
            type="button"
            onClick={handleExportMarkdownCv}
            title="Exportar Currículo Completo (.md)"
            className="hidden sm:flex min-h-[44px] px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs font-mono text-[var(--text-primary)] items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Exportar CV</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={
              theme === 'dark'
                ? 'Mudar para Tema Claro (Papel Editorial)'
                : 'Mudar para Tema Escuro (Obsidiana)'
            }
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-[var(--text-primary)] flex items-center justify-center transition-colors shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>
        </div>

        {/* EXPANDABLE NAVIGATION DROPDOWN */}
        {menuOpen && (
          <div
            role="dialog"
            aria-label="Menu de navegação entre seções e exportação de currículo"
            className="mt-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl p-4 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Navegação Direta
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                Rio Grande do Sul · BR
              </span>
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{item.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#E11D48] transition-colors shrink-0" />
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleExportMarkdownCv();
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-mono flex items-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Currículo (.MD / Texto)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAiInspector('llms');
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs font-mono text-[var(--text-primary)] flex items-center gap-2 transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5 text-[#E11D48]" />
                Ver /llms.txt & JSON-LD
              </button>
            </div>
          </div>
        )}

        {/* REDESIGNED INTERACTIVE ASSISTANT & JOB-FIT COMMAND PALETTE */}
        {chatOpen && (
          <div
            role="dialog"
            aria-label="Assistente interativo de portfólio e analisador de compatibilidade de vaga"
            className="mt-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden flex flex-col max-h-[74vh]"
          >
            {/* Top Mode Switcher Bar: Clean & Functional for Visitors/Recruiters */}
            <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 bg-[var(--bg-surface)]">
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setChatMode('chat')}
                  className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    chatMode === 'chat'
                      ? 'bg-[#E11D48] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Perguntas Rápidas
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode('jobfit')}
                  className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    chatMode === 'jobfit'
                      ? 'bg-[#E11D48] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Testar Fit com Vaga
                </button>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setMessages([initialGreeting])}
                    title="Limpar conversa"
                    className="min-h-[32px] px-2.5 rounded-lg text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Limpar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseChat}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors"
                  aria-label="Fechar assistente"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {chatMode === 'jobfit' ? (
              /* MODE 2: RECRUITER JOB-FIT ANALYZER */
              <div className="p-5 space-y-4 overflow-y-auto thin-scrollbar">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Analisador de Compatibilidade com Vaga
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Escolha um perfil abaixo ou cole os requisitos da sua vaga para gerar um
                    mapeamento direto com as experiências e projetos do Pedro:
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => sendMessage(preset.prompt)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs font-medium text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                    >
                      <span>{preset.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#E11D48]" />
                    </button>
                  ))}
                </div>

                <form onSubmit={handleJobFitSubmit} className="space-y-3 pt-1">
                  <textarea
                    rows={4}
                    value={jobDescriptionInput}
                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                    placeholder="Ou cole aqui a descrição/requisitos da vaga (ex: React, TypeScript, Node.js, liderança técnica...)"
                    className="w-full rounded-xl p-3 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] focus:border-[#E11D48] focus:outline-none text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!jobDescriptionInput.trim() || isLoading}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#be123c] disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Gerar Análise de Fit
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* MODE 1: INTERACTIVE CONVERSATION FEED */
              <>
                <div className="p-4 sm:p-5 overflow-y-auto thin-scrollbar space-y-4 flex-1">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`relative group max-w-[90%] sm:max-w-[84%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#E11D48] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {msg.role === 'model' ? (
                          <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                        ) : (
                          <div>{msg.text}</div>
                        )}

                        {msg.role === 'model' && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            title="Copiar resposta"
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Contextual Portfolio Actions attached to Model Reply */}
                      {msg.role === 'model' && msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {msg.actions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleExecuteAction(act)}
                              className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-[11px] font-mono text-[var(--text-primary)] transition-colors flex items-center gap-1"
                            >
                              <span>{act.label}</span>
                              <ArrowUpRight className="w-3 h-3 text-[#E11D48]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] px-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#E11D48] animate-ping" />
                      <span>Consultando experiências e projetos do Pedro...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggested Questions Bar (Clean Wrap / No Native Scrollbar) */}
                <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        disabled={isLoading}
                        className="min-h-[32px] px-3 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#E11D48] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </header>
    </>
  );
};
