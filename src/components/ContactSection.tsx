import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Github, Linkedin, Loader2 } from 'lucide-react';
import { CONTACT_LIMITS, DEFAULT_PORTFOLIO_DATA } from '../data/portfolioData';
import { CTA } from './CTA';
import { CopyEmailButton, Reveal } from './ui';

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'rejected'; message: string }
  | { kind: 'fallback' };

type FieldName = 'name' | 'email' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;
type FieldDirty = Partial<Record<FieldName, boolean>>;

const REJECTED_STATUSES = new Set([400, 413, 429]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: FieldName, rawValue: string): string | undefined {
  const value = rawValue.trim();

  if (field === 'name') {
    if (value.length < CONTACT_LIMITS.name.min) {
      return `Informe seu nome com pelo menos ${CONTACT_LIMITS.name.min} caracteres.`;
    }
    if (value.length > CONTACT_LIMITS.name.max) {
      return `Use no máximo ${CONTACT_LIMITS.name.max} caracteres no nome.`;
    }
    return undefined;
  }

  if (field === 'email') {
    if (!value || value.length > CONTACT_LIMITS.email.max || !EMAIL_PATTERN.test(value)) {
      return 'Informe um e-mail válido.';
    }
    return undefined;
  }

  if (value.length < CONTACT_LIMITS.message.min) {
    return `Escreva uma mensagem com pelo menos ${CONTACT_LIMITS.message.min} caracteres.`;
  }
  if (value.length > CONTACT_LIMITS.message.max) {
    return `Use no máximo ${CONTACT_LIMITS.message.max} caracteres na mensagem.`;
  }
  return undefined;
}

const FIELD_LABELS: Record<FieldName, string> = {
  name: 'Nome',
  email: 'E-mail',
  message: 'Mensagem'
};

function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [dirty, setDirty] = useState<FieldDirty>({});
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const announceTimer = useRef<number | undefined>(undefined);
  const sending = status.kind === 'sending';
  const messageLength = message.length;

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  const scheduleAnnouncement = (field: FieldName, errorText: string) => {
    window.clearTimeout(announceTimer.current);
    setLiveAnnouncement('');
    announceTimer.current = window.setTimeout(() => {
      setLiveAnnouncement(`${FIELD_LABELS[field]}: ${errorText}`);
    }, 500);
  };

  const clearAnnouncement = () => {
    window.clearTimeout(announceTimer.current);
    setLiveAnnouncement('');
  };

  const handleFieldChange = (field: FieldName, value: string) => {
    if (status.kind === 'rejected' || status.kind === 'sent') {
      setStatus({ kind: 'idle' });
    }
    if (field === 'name') setName(value);
    else if (field === 'email') setSenderEmail(value);
    else setMessage(value);

    setDirty((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

    if (errors[field]) {
      const nextError = validateField(field, value);
      if (!nextError) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
        clearAnnouncement();
      } else {
        setErrors((prev) => ({ ...prev, [field]: nextError }));
      }
    }
  };

  const handleFieldBlur = (field: FieldName, value: string) => {
    if (!dirty[field]) return;
    const nextError = validateField(field, value);
    if (nextError) {
      if (errors[field] !== nextError) {
        setErrors((prev) => ({ ...prev, [field]: nextError }));
        scheduleAnnouncement(field, nextError);
      }
    } else if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
      clearAnnouncement();
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {
      name: validateField('name', name),
      email: validateField('email', senderEmail),
      message: validateField('message', message)
    };

    const hasError = Boolean(nextErrors.name || nextErrors.email || nextErrors.message);
    if (hasError) {
      setErrors(nextErrors);
      setDirty({ name: true, email: true, message: true });
      clearAnnouncement();
      if (nextErrors.name) nameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.message) messageRef.current?.focus();
      return;
    }

    const payload = {
      name: name.trim(),
      email: senderEmail.trim(),
      message: message.trim(),
      website,
      source: 'form' as const
    };

    const openMailClient = () => {
      const subject = encodeURIComponent(`Portfólio - ${payload.name}`);
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
      setName('');
      setSenderEmail('');
      setMessage('');
      setWebsite('');
      setErrors({});
      setDirty({});
      clearAnnouncement();
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

  const nameDescribedBy = errors.name ? 'contato-nome-erro' : undefined;
  const emailDescribedBy = errors.email ? 'contato-email-erro' : undefined;
  const messageDescribedBy = errors.message
    ? 'contato-mensagem-contador contato-mensagem-erro'
    : 'contato-mensagem-contador';

  return (
    <form
      noValidate
      aria-labelledby="contato-form-titulo"
      onSubmit={onSubmit}
      aria-busy={sending}
      className="relative border border-line bg-surface p-5 transition-colors hover:border-ink sm:p-6"
    >
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <h3 id="contato-form-titulo" className="font-bold">
        Ou escreva sua mensagem
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contato-nome" className="field-label">
            Nome
          </label>
          <input
            ref={nameRef}
            id="contato-nome"
            name="name"
            type="text"
            required
            minLength={CONTACT_LIMITS.name.min}
            maxLength={CONTACT_LIMITS.name.max}
            autoComplete="name"
            enterKeyHint="next"
            placeholder="Seu nome"
            value={name}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={nameDescribedBy}
            onChange={(event) => handleFieldChange('name', event.currentTarget.value)}
            onBlur={(event) => handleFieldBlur('name', event.currentTarget.value)}
            className={errors.name ? 'field !border-invalid' : 'field'}
          />
          {errors.name && (
            <p id="contato-nome-erro" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-invalid">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contato-email" className="field-label">
            E-mail
          </label>
          <input
            ref={emailRef}
            id="contato-email"
            name="email"
            type="email"
            inputMode="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="nome@dominio.com"
            value={senderEmail}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={emailDescribedBy}
            onChange={(event) => handleFieldChange('email', event.currentTarget.value)}
            onBlur={(event) => handleFieldBlur('email', event.currentTarget.value)}
            className={errors.email ? 'field !border-invalid' : 'field'}
          />
          {errors.email && (
            <p id="contato-email-erro" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-invalid">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contato-mensagem" className="field-label">
          Mensagem
        </label>
        <textarea
          ref={messageRef}
          id="contato-mensagem"
          name="message"
          required
          minLength={CONTACT_LIMITS.message.min}
          maxLength={CONTACT_LIMITS.message.max}
          rows={5}
          placeholder="Sobre o que você quer conversar?"
          value={message}
          aria-invalid={errors.message ? 'true' : 'false'}
          aria-describedby={messageDescribedBy}
          onChange={(event) => handleFieldChange('message', event.currentTarget.value)}
          onBlur={(event) => handleFieldBlur('message', event.currentTarget.value)}
          className={errors.message ? 'field field-area !border-invalid' : 'field field-area'}
        />

        {errors.message && (
          <p id="contato-mensagem-erro" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-invalid">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.message}</span>
          </p>
        )}
      </div>

      <p id="contato-mensagem-contador" className="mt-1.5 text-right font-mono text-xs text-muted">
        {messageLength}/{CONTACT_LIMITS.message.max}
        <span className="sr-only"> caracteres, mínimo de {CONTACT_LIMITS.message.min}</span>
      </p>

      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contato-website">Site</label>
        <input
          id="contato-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.currentTarget.value)}
        />
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
      <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
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
