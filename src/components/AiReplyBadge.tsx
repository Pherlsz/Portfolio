export function AiReplyBadge() {
  return (
    <span
      className="mb-1.5 inline-flex max-w-full items-center border border-line bg-surface px-2 py-0.5 font-mono text-[0.6875rem] font-semibold text-muted"
      title="Resposta gerada por IA"
    >
      <span aria-hidden="true">IA</span>
      <span className="sr-only">Resposta gerada por IA</span>
    </span>
  );
}
