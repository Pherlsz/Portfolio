export const ptBR = {
  'brand.name': 'pherls.dev',
  'brand.subtitle': 'Pedro Henrique Lopes',
  'nav.newChat': 'Novo chat',
  'nav.sections': 'Seções',
  'nav.history': 'Histórico',
  'nav.historyEmpty': 'Suas conversas ficam salvas só neste navegador.',
  'nav.projects': 'Projetos',
  'nav.experience': 'Experiência',
  'nav.studies': 'Estudos',
  'nav.articles': 'Artigos',
  'nav.ai': 'AI / Arquivos',
  'nav.contact': 'Contato',
  'nav.cv': 'Currículo',
  'nav.collapseSidebar': 'Recolher barra lateral',
  'nav.expandSidebar': 'Abrir barra lateral',
  'theme.light': 'Tema claro',
  'theme.dark': 'Tema escuro',
  'theme.toggle': 'Alternar tema',

  'chat.greeting': 'Por onde começamos?',
  'chat.placeholder': 'Pergunte sobre projetos, experiência ou cole uma vaga...',
  'chat.send': 'Enviar',
  'chat.stop': 'Parar',
  'chat.deleteThread': 'Apagar conversa',
  'chat.featuredHeading': 'Perguntas em destaque',
  'chat.breakersHeading': 'Tenta quebrar',
  'chat.privacyNotice': 'As perguntas podem ser registradas sem dados pessoais para curadoria semanal.',
  'chat.unavailable': 'Assistente indisponível no momento. Você pode navegar pelas seções ou baixar o CV.',

  'reasoning.label': 'Raciocínio',
  'reasoning.fast': 'Rápido',
  'reasoning.fastDesc': 'Respostas diretas e menor latência.',
  'reasoning.default': 'Padrão',
  'reasoning.defaultDesc': 'Equilíbrio entre profundidade e velocidade.',
  'reasoning.high': 'Profundo',
  'reasoning.highDesc': 'Mais contexto para análises técnicas e vagas.',

  'skills.vaga': '/vaga',
  'skills.vagaDesc': 'Avalia aderência de uma descrição de vaga',
  'skills.resumo': '/resumo',
  'skills.resumoDesc': 'Gera um resumo rápido para recrutadores',

  'projects.title': 'Projetos',
  'projects.askCta': 'Perguntar no chat',
  'projects.openRepo': 'Repositório',
  'projects.openLive': 'Abrir',
  'projects.openDecisions': 'Diário de decisões',
  'projects.archivedVersion': 'Versão arquivada',

  'experience.title': 'Experiência',
  'experience.askCta': 'Perguntar sobre a trajetória',
  'experience.previewPdf': 'Visualizar PDF',
  'experience.downloadPdf': 'PDF',
  'experience.downloadDocx': 'DOCX',
  'experience.downloadMd': 'MD',
  'experience.downloadJson': 'JSON',
  'experience.education': 'Formação',
  'experience.languages': 'Idiomas',
  'experience.skills': 'Stack técnica',

  'studies.title': 'Estudos',
  'studies.tabStudies': 'Estudos',
  'studies.tabCertificates': 'Certificados',
  'studies.askCta': 'Perguntar sobre este estudo',
  'studies.backToList': 'Voltar para estudos',
  'studies.verifyCredential': 'Verificar credencial',
  'studies.issuedAt': 'Emitido em',
  'studies.expiresAt': 'Validade',
  'studies.noExpiry': 'Sem expiração',

  'articles.title': 'Artigos',
  'articles.backToList': 'Voltar para artigos',
  'articles.askCta': 'Discutir artigo no chat',

  'ai.title': 'AI / Arquivos',
  'ai.copy': 'Copiar',
  'ai.copied': 'Copiado',
  'ai.open': 'Abrir',

  'contact.title': 'Enviar mensagem',
  'contact.name': 'Nome',
  'contact.email': 'E-mail',
  'contact.message': 'Mensagem',
  'contact.submit': 'Enviar recado',
  'contact.sending': 'Enviando...',
  'contact.sent': 'Recado enviado com sucesso.',
  'contact.error': 'Não foi possível enviar o recado agora.',

  'notFound.title': 'Página não encontrada',
  'notFound.description': 'Essa rota não existe por aqui, mas você pode voltar para o chat ou explorar as seções.',
  'notFound.backHome': 'Voltar para o chat'
} as const;

export type LocaleKey = keyof typeof ptBR;
export type LocaleDictionary = Record<LocaleKey, string>;

export function t(key: LocaleKey, vars?: Record<string, string | number>): string {
  let value: string = ptBR[key];
  if (!vars) return value;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}
