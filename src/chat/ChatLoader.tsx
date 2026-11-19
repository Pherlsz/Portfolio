import Mascot, { type Reasoning } from './Mascot';

export function ChatLoader({
  reasoning,
  statusText
}: {
  reasoning: Reasoning;
  statusText?: string;
}) {
  return (
    <div className="status-in py-1">
      <Mascot reasoning={reasoning} statusText={statusText} />
    </div>
  );
}
