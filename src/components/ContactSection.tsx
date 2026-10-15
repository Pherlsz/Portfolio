import { useState, type FormEvent } from 'react';
import { Download, Github, Linkedin } from 'lucide-react';
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
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      source: 'form' as const
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

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={status === 'sending'}
      className="rounded-[1.75rem] border border-line bg-surface p-5 sm:p-6"
    >
      <p className="font-bold">Ou escreva sua mensagem</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Nome</span>
          <input
            name="name"
            type="text"
            required
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
          rows={5}
          placeholder="Sobre o que você quer conversar?"
          className="field field-area"
        />
      </label>
      <CTA type="submit" variant="secondary" className="mt-5 w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Enviando…' : 'Enviar'}
      </CTA>
      {status === 'sent' && (
        <p className="eyebrow mt-3 text-valid" role="status">
          Mensagem enviada.
        </p>
      )}
      {status === 'error' && (
        <p className="eyebrow mt-3 text-invalid" role="status">
          Se o e-mail não abrir, copie o endereço ao lado.
        </p>
      )}
    </form>
  );
}

export function ContactSection({ onOpenJobFit }: { onOpenJobFit: () => void }) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      aria-labelledby="contato-titulo"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
    >
      <p className="eyebrow">Vamos conversar?</p>
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div>
          <h2 id="contato-titulo" className="display-wide text-[clamp(2.4rem,7vw,5rem)] leading-[0.9]">
            Entre em contato
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">{profile.trustCopy}</p>
          <p className="mt-4 max-w-md text-ink-soft">
            {profile.workMode}. Pretensão salarial {profile.salary.toLowerCase()}.
          </p>

          <div className="mt-8 flex max-w-xl flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <CTA
                variant="primary"
                href={profile.cvUrl}
                download
                className="w-full sm:w-auto"
                icon={<Download className="size-4" aria-hidden="true" />}
              >
                Baixar CV (PDF)
              </CTA>
              <JobFitCta onOpenJobFit={onOpenJobFit} className="w-full sm:w-auto" />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <a
                href={`mailto:${profile.email}`}
                translate="no"
                className="text-lg font-semibold underline decoration-marker decoration-2 underline-offset-4"
              >
                {profile.email}
              </a>
              <CopyEmailButton
                email={profile.email}
                label="Copiar e-mail"
                className="h-9 cursor-pointer rounded-full border border-line px-3 text-sm font-semibold transition-[background-color,border-color,transform] duration-150 hover:border-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] active:translate-y-px"
              />
            </div>

            <ul className="flex flex-wrap gap-2">
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

        <ContactForm email={profile.email} />
      </div>
    </section>
  );
}
