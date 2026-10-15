import { useState, type FormEvent } from 'react';
import { Download, Github, Linkedin } from 'lucide-react';
import { DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
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
      <button type="submit" className="btn btn-primary mt-5 w-full justify-center" disabled={status === 'sending'}>
        {status === 'sending' ? 'Enviando…' : 'Enviar'}
      </button>
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

export function ContactSection() {
  const { profile } = DEFAULT_PORTFOLIO_DATA;

  return (
    <section
      aria-labelledby="contato-titulo"
      className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24"
    >
      <p className="eyebrow">Vamos conversar?</p>
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div>
          <h2 id="contato-titulo" className="display-wide text-[clamp(2.4rem,7vw,5rem)] leading-[0.9]">
            Entre em contato
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            Aberto a vagas de Frontend Engineer e Software Engineer, nível {profile.seniority.toLowerCase()}.{' '}
            {profile.workMode}. Pretensão salarial {profile.salary.toLowerCase()}. O jeito mais rápido é o e-mail.
          </p>
          <div className="mt-8 flex min-w-0 flex-col items-start gap-6">
            <CopyEmailButton email={profile.email} hint />
            <ul className="flex flex-wrap gap-2">
              <li>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Perfil no LinkedIn de Pedro Henrique Lopes"
                  className="btn btn-primary"
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
              <li>
                <a href={profile.cvUrl} download className="btn btn-ghost">
                  <Download className="size-4" aria-hidden="true" />
                  CV (PDF)
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
