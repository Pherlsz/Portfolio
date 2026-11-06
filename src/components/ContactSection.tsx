import { useState, type FormEvent } from 'react';
import { Github, Linkedin, Loader2 } from 'lucide-react';
import { CONTACT_LIMITS, DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { CopyEmailButton, Reveal } from './ui';

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  /** O servidor recusou (validação, tamanho ou limite de envios): mostra o motivo. */
  | { kind: 'rejected'; message: string }
  /** Falha de rede ou do servidor: abre o app de e-mail com a mensagem pronta. */
  | { kind: 'fallback' };

const REJECTED_STATUSES = new Set([400, 413, 429]);

function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });
  const [messageLength, setMessageLength] = useState(0);
  const sending = status.kind === 'sending';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      website: String(data.get('website') ?? ''),
      source: 'form' as const
    };

    const openMailClient = () => {
      const subject = encodeURIComponent(`Portfólio — ${payload.name}`);
      const body = encodeURIComponent(`Nome: ${payload.name}\nE-mail: ${payload.email}\n\n${payload.message}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setStatus({ kind: 'fallback' });
    };

    setStatus({ kind: 'sending' });
    let response: Response;
    try {
      response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      openMailClient();
      return;
    }

    if (response.ok) {
      form.reset();
      setMessageLength(0);
      setStatus({ kind: 'sent' });
      return;
    }

    if (REJECTED_STATUSES.has(response.status)) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus({ kind: 'rejected', message: body?.error ?? 'Confira os campos e tente de novo.' });
      return;
    }

    openMailClient();
  };

  return (
    <form
      onSubmit={onSubmit}
      onInput={() => {
        if (status.kind === 'rejected' || status.kind === 'sent') setStatus({ kind: 'idle' });
      }}
      aria-busy={sending}
      className="relative rounded-[1.75rem] border border-line bg-surface p-5 sm:p-6"
    >
      <p className="font-bold">Ou escreva sua mensagem</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Nome</span>
          <input
            name="name"
            type="text"
            required
            minLength={CONTACT_LIMITS.name.min}
            maxLength={CONTACT_LIMITS.name.max}
            autoComplete="name"
            placeholder="Seu nome"
            className="field"
          />
        </label>
        <label className="block">
          <span className="field-label">E-mail</span>
          <input
            name="email"
            type="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            autoComplete="email"
            spellCheck={false}
            placeholder="nome@dominio.com"
            className="field"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="field-label">Mensagem</span>
        <textarea
          name="message"
          required
          minLength={CONTACT_LIMITS.message.min}
          maxLength={CONTACT_LIMITS.message.max}
          rows={5}
          placeholder="Sobre o que você quer conversar?"
          aria-describedby="contato-mensagem-contador"
          onChange={(event) => setMessageLength(event.currentTarget.value.length)}
          className="field field-area"
        />
      </label>
      <p id="contato-mensagem-contador" className="mt-1.5 text-right font-mono text-xs text-muted">
        {messageLength}/{CONTACT_LIMITS.message.max}
        <span className="sr-only"> caracteres, mínimo de {CONTACT_LIMITS.message.min}</span>
      </p>
      {/* Honeypot: invisível para pessoas; bots que preenchem tudo são descartados no servidor. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Site
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <CTA
        type="submit"
        variant="secondary"
        className="mt-4 w-full"
        disabled={sending}
        icon={sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : undefined}
      >
        {sending ? 'Enviando…' : 'Enviar'}
      </CTA>
      {status.kind === 'sent' && (
        <p className="eyebrow mt-3 text-valid" role="status">
          Mensagem enviada.
        </p>
      )}
      {status.kind === 'rejected' && (
        <p className="eyebrow mt-3 text-invalid" role="alert">
          {status.message}
        </p>
      )}
      {status.kind === 'fallback' && (
        <p className="eyebrow mt-3 text-invalid" role="alert">
          Não consegui enviar por aqui. Abri seu app de e-mail com a mensagem pronta; se ele não abrir, copie o
          endereço ao lado.
        </p>
      )}
    </form>
  );
}

export function ContactSection() {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      aria-labelledby="contato-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
    >
      <Reveal>
        <p className="eyebrow">Vamos conversar?</p>
      </Reveal>
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <Reveal delay={0.04}>
          <h2 id="contato-titulo" className="display-wide text-[clamp(2.4rem,7vw,5rem)] leading-[0.9]">
            Entre em contato
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            {profile.workMode}. Pretensão salarial {profile.salary.toLowerCase()}.
          </p>

          <div className="mt-8 flex max-w-xl flex-col gap-6 border-t border-line pt-6">
            <div>
              <p className="eyebrow">E-mail direto</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <a
                  href={`mailto:${profile.email}`}
                  translate="no"
                  className="inline-flex min-h-11 items-center text-lg font-semibold underline decoration-marker decoration-2 underline-offset-4"
                >
                  {profile.email}
                </a>
                <CopyEmailButton
                  email={profile.email}
                  label="Copiar e-mail"
                  className="min-h-11 cursor-pointer border border-line px-3 text-sm font-semibold transition-[background-color,border-color,transform] duration-150 hover:border-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] active:translate-y-px"
                />
              </div>
            </div>

            <div>
              <p className="eyebrow">Redes e código</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                <li>
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Perfil no LinkedIn de Pedro Henrique Lopes"
                    className="btn btn-ghost"
                  >
                    <Linkedin className="size-4" aria-hidden="true" />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Perfil no GitHub de Pedro Henrique Lopes"
                    className="btn btn-ghost"
                  >
                    <Github className="size-4" aria-hidden="true" />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm email={profile.email} />
        </Reveal>
      </div>
    </section>
  );
}
