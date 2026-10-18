import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { JobFitCta } from './JobFitCta';
import { CopyEmailButton } from './ui';

function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: { name: string; email: string; message: string; source: 'form' } = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      source: 'form'
    };

    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('fail');
      form.reset();
      setStatus('sent');
    } catch {
      const subject = encodeURIComponent(`Portfólio — ${payload.name}`);
      const body = encodeURIComponent(`Nome: ${payload.name}\nE-mail: ${payload.email}\n\n${payload.message}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setStatus('error');
    }
  };

  const onMessageKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form onSubmit={onSubmit} aria-busy={status === 'sending'} className="max-w-prose border-t border-line pt-6">
      <p className="font-semibold">Ou escreva sua mensagem</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor="contato-nome">
          <span className="field-label">Nome</span>
          <input
            id="contato-nome"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Seu nome…"
            className="field"
          />
        </label>
        <label className="block" htmlFor="contato-email">
          <span className="field-label">E-mail</span>
          <input
            id="contato-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            spellCheck={false}
            placeholder="nome@dominio.com…"
            className="field"
          />
        </label>
      </div>
      <label className="mt-4 block" htmlFor="contato-mensagem">
        <span className="field-label">Mensagem</span>
        <textarea
          id="contato-mensagem"
          name="message"
          required
          rows={5}
          placeholder="Sobre o que você quer conversar?…"
          className="field field-area"
          onKeyDown={onMessageKey}
        />
      </label>
      <CTA type="submit" variant="primary" className="mt-5" disabled={status === 'sending'}>
        {status === 'sending' ? 'Enviando…' : 'Enviar'}
      </CTA>
      {status === 'sent' ? (
        <p className="eyebrow mt-3" role="status">
          Mensagem enviada.
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="eyebrow mt-3 text-invalid" role="status">
          Se o e-mail não abrir, copie o endereço ao lado.
        </p>
      ) : null}
    </form>
  );
}

export function ContactSection({
  onOpenJobFit,
  onOpenCv
}: {
  onOpenJobFit: () => void;
  onOpenCv: () => void;
}) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section aria-labelledby="contato-titulo" className="scroll-mt-5 px-5 py-14 sm:px-8 sm:py-20">
      <h2 id="contato-titulo" className="display text-[1.5rem] leading-tight sm:text-[1.75rem]">
        Entre em contato
      </h2>
      <p className="mt-4 max-w-prose text-ink-soft">{profile.trustCopy}</p>
      <p className="mt-3 max-w-prose text-ink-soft">
        {profile.workMode}. Pretensão salarial {profile.salary.toLowerCase()}.
      </p>

      <div className="mt-6 flex max-w-prose flex-col gap-4">
        <p className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1">
          <CTA variant="tertiary" onClick={onOpenCv} aria-haspopup="dialog" aria-controls="cv-preview">
            Ver CV
          </CTA>
          <JobFitCta onOpenJobFit={onOpenJobFit} />
        </p>

        <p className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1">
          <a href={`mailto:${profile.email}`} translate="no" className="link text-lg font-semibold">
            {profile.email}
          </a>
          <CopyEmailButton email={profile.email} label="Copiar e-mail" className="link cursor-pointer" />
        </p>

        <p className="flex min-h-11 flex-wrap items-center gap-x-4">
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="Perfil no LinkedIn de Pedro Henrique Lopes"
            className="link"
          >
            LinkedIn
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            aria-label="Perfil no GitHub de Pedro Henrique Lopes"
            className="link"
          >
            GitHub
          </a>
        </p>
      </div>

      <div className="mt-10">
        <ContactForm email={profile.email} />
      </div>
    </section>
  );
}
