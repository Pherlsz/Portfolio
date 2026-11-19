export const ptBR = {
  'brand.name': 'pherls.dev',
  'brand.subtitle': 'Pedro Henrique Lopes',
  'nav.newChat': 'Novo chat',
  'nav.sections': 'Seções',
  'nav.history': 'Histórico',
  'nav.historyEmpty': 'Salvo só neste navegador.',
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
  'chat.placeholder': 'Pergunte algo ou cole uma vaga...',
  'chat.send': 'Enviar',
  'chat.stop': 'Parar',
  'chat.deleteThread': 'Apagar conversa',
  'chat.featuredHeading': 'Perguntas em destaque',
  'chat.breakersHeading': 'Tenta quebrar',
  'chat.privacyNotice': 'Perguntas anônimas podem ir para a curadoria semanal.',
  'chat.unavailable': 'Assistente indisponível. Explore as seções ou baixe o CV.',

  'reasoning.label': 'Raciocínio',
  'reasoning.fast': 'Rápido',
  'reasoning.fastDesc': 'Direto ao ponto.',
  'reasoning.default': 'Padrão',
  'reasoning.defaultDesc': 'Rápido e equilibrado.',
  'reasoning.high': 'Profundo',
  'reasoning.highDesc': 'Análise detalhada para vagas e código.',

  'skills.vaga': '/vaga',
  'skills.vagaDesc': 'Analisa aderência a uma vaga',
  'skills.resumo': '/resumo',
  'skills.resumoDesc': 'Resumo rápido para recrutadores',

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
  'notFound.description': 'Rota não encontrada. Volte ao chat ou explore as seções.',
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
