import type { Reasoning } from '../utils/chat';
import Mascot from './Mascot';

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
