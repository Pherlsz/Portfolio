import { useState, type FormEvent } from 'react';
import { FileText, Github, Linkedin } from 'lucide-react';
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
    <form onSubmit={onSubmit} aria-busy={status === 'sending'} className="border border-line p-4">
      <p className="font-bold">Ou escreva sua mensagem</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <span className="field-error">Informe seu nome.</span>
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
          <span className="field-error">Informe um e-mail válido.</span>
        </label>
      </div>
      <label className="mt-4 block">
        <span className="field-label">Mensagem</span>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Sobre o que você quer conversar?"
          className="field field-area"
        />
        <span className="field-error">Escreva uma mensagem.</span>
      </label>
      <CTA type="submit" variant="secondary" className="mt-4 w-full" disabled={status === 'sending'}>
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

export function ContactSection({
  onOpenJobFit,
  onOpenCv
}: {
  onOpenJobFit: () => void;
  onOpenCv: () => void;
}) {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section aria-labelledby="contato-titulo" className="border-t border-line py-8">
      <h2 id="contato-titulo" className="display text-xl">
        Contato
      </h2>
      <div className="mt-4">
        <ContactForm email={profile.email} />
      </div>
      <p className="mt-6 max-w-[70ch] text-ink-soft">{profile.trustCopy}</p>
      <p className="mt-3 max-w-[70ch] text-ink-soft">
        {profile.workMode}. Pretensão salarial {profile.salary.toLowerCase()}.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CTA
            variant="primary"
            onClick={onOpenCv}
            aria-haspopup="dialog"
            aria-controls="cv-preview"
            className="w-full sm:w-auto"
            icon={<FileText className="size-4" aria-hidden="true" />}
          >
            Ver CV
          </CTA>
          <JobFitCta onOpenJobFit={onOpenJobFit} className="w-full sm:w-auto" />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <a
            href={`mailto:${profile.email}`}
            translate="no"
            className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold underline underline-offset-4"
          >
            {profile.email}
          </a>
          <CopyEmailButton
            email={profile.email}
            label="Copiar e-mail"
            className="h-11 cursor-pointer border border-line px-3 text-sm font-semibold transition-[background-color,border-color,transform] duration-150 hover:border-ink hover:bg-line focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:[outline-color:var(--focus-ring)] active:translate-y-px"
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
    </section>
  );
}
