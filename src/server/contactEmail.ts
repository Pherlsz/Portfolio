const HEADER_CONTROLS = /[\u0000-\u001F\u007F-\u009F]/g;

export const CONTACT_FROM = {
  email: 'contato@pherls.dev',
  name: 'Pedro Lopes'
} as const;

export const CONTACT_TO = 'phpherls@gmail.com';

export type ContactEmail = {
  from: { email: string; name: string };
  to: string;
  subject: string;
  text: string;
  replyTo: string;
};

export type SendEmail = {
  send(message: ContactEmail): Promise<{ messageId: string }>;
};

export type ContactNotice = {
  at: string;
  name: string;
  email: string;
  message: string;
  source: 'form' | 'agent';
};

export function sanitizeHeaderValue(value: string): string {
  return value.replace(HEADER_CONTROLS, '');
}

export function buildContactEmail(entry: ContactNotice): ContactEmail {
  const name = sanitizeHeaderValue(entry.name);
  const email = sanitizeHeaderValue(entry.email);

  return {
    from: { email: CONTACT_FROM.email, name: CONTACT_FROM.name },
    to: CONTACT_TO,
    subject: `[pherls.dev] Nova mensagem de ${name}`,
    text: [
      `Nome: ${entry.name}`,
      `E-mail: ${entry.email}`,
      `Origem: ${entry.source}`,
      `Quando: ${entry.at}`,
      '',
      entry.message
    ].join('\n'),
    replyTo: email
  };
}

export async function sendContactNotification(
  binding: SendEmail | undefined,
  entry: ContactNotice
): Promise<void> {
  if (!binding) return;

  try {
    await binding.send(buildContactEmail(entry));
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'contact_email_failed',
        message: error instanceof Error ? error.message : String(error)
      })
    );
  }
}
