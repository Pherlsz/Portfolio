export interface CvExperienceItem {
  company: string;
  role: string;
  period: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface CvEducationItem {
  course: string;
  institution: string;
  studyType: string;
  period: string;
  startDate: string;
  endDate: string;
}

export interface CvLanguageItem {
  name: string;
  level: string;
}

export interface CvCertificationItem {
  name: string;
  issuer: string;
  year: string;
}

export interface CvData {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
  city: string;
  region: string;
  summary: string;
  experience: CvExperienceItem[];
  education: CvEducationItem[];
  skills: {
    technical: string[];
    behavioral: string[];
  };
  languages: CvLanguageItem[];
  certifications: CvCertificationItem[];
}

export const CV_DATA: CvData = {
  name: 'Pedro Henrique Lopes',
  title: 'Desenvolvedor Frontend | Frontend Engineer | Software Engineer',
  email: 'phpherls@gmail.com',
  phone: '+55 (51) 93620-0779',
  linkedin: 'https://linkedin.com/in/pherls',
  github: 'https://github.com/Pherlsz',
  website: 'https://pherls.dev',
  location: 'Charqueadas, RS',
  city: 'Charqueadas',
  region: 'RS',
  summary:
    'Engenheiro de Software e Desenvolvedor Frontend com mais de 4 anos de experiência em aplicações web em produção com React, Next.js e TypeScript. Especialista em componentização, Design Systems acessíveis (WCAG 2.1 AA), performance web (virtualização de DOM, TanStack Query, Zustand), testes automatizados (Vitest) e desenvolvimento de interfaces para funcionalidades baseadas em LLMs.',
  experience: [
    {
      company: 'Atlas Governance',
      role: 'Software Engineer',
      period: 'Novembro 2021 a Julho 2026',
      startDate: '2021-11',
      endDate: '2026-07',
      highlights: [
        'Fui um dos responsáveis pela criação de primitivos e componentes customizados do Design System da plataforma Atlas PLG com React, Next.js e TypeScript, contribuindo para a construção de uma biblioteca com mais de 30 componentes reutilizáveis, padronização visual, acessibilidade (WCAG 2.1 Level AA) e discussões técnicas com o time de arquitetura.',
        'Otimizei a performance de listagens com mais de 5.000 registros no módulo Atlas Sign, utilizando virtualização do DOM com TanStack Virtual (@tanstack/react-virtual) e code splitting para reduzir gargalos de renderização e problemas de layout thrashing.',
        'Aprimorei o gerenciamento de dados e estados da interface com TanStack Query, Zustand e Context API, utilizando cache e deduplicação de requisições para reduzir chamadas redundantes à rede e organizar o estado das aplicações.',
        'Desenvolvi módulos de navegação em árvore e fluxos críticos de assinatura eletrônica em uma plataforma com mais de 10.000 usuários ativos, incorporando Error Boundaries para contenção de falhas em tempo de execução e testes automatizados com Vitest e React Testing Library.',
        'Desenvolvi as interfaces de funcionalidades baseadas em modelos de linguagem (LLMs) em produção, incluindo um chat e a exibição de relatórios gerados por IA.',
        'Implementei e otimizei configurações de build frontend utilizando Webpack e Vite para modularização eficiente dos bundles em projetos React e TypeScript, validando a compatibilidade cross-browser e a responsividade em múltiplos dispositivos.',
        'Refatorei o serviço de mensageria corporativa em C#/.NET Core e APIs RESTful, consolidando mais de 1.000 templates legados de e-mail em modelos parametrizados utilizando Docker e esteiras de CI/CD no Azure DevOps.'
      ]
    },
    {
      company: 'Atlas Governance',
      role: 'Software Engineering Intern',
      period: 'Março 2021 a Novembro 2021',
      startDate: '2021-03',
      endDate: '2021-11',
      highlights: [
        'Desenvolvi e mantive interfaces corporativas e serviços transacionais com React, TypeScript e C#/.NET Core, contribuindo para a estabilidade operacional e a manutenção das regras de negócio em produção.',
        'Criei uma biblioteca padronizada de componentes reutilizáveis com Styled Components e Context API, reduzindo redundâncias de código e o tempo de desenvolvimento em mais de 15 fluxos corporativos.',
        'Diagnostiquei e corrigi falhas nas camadas de frontend e na integração entre serviços via análise de causa raiz (RCA) e Azure DevOps, aplicando práticas de segurança alinhadas ao OWASP Top 10 (prevenção de XSS e sanitização de dados de entrada).'
      ]
    }
  ],
  education: [
    {
      course: 'Tecnólogo em Análise e Desenvolvimento de Sistemas',
      institution: 'Estácio',
      studyType: 'Tecnólogo',
      period: 'Agosto 2022 a Dezembro 2024',
      startDate: '2022-08',
      endDate: '2024-12'
    }
  ],
  skills: {
    technical: [
      'React.js',
      'TypeScript',
      'Next.js',
      'JavaScript (ES6+)',
      'HTML5',
      'CSS3',
      'Tailwind CSS',
      'Styled Components',
      'TanStack Query',
      'TanStack Virtual',
      'Zustand',
      'Redux',
      'Context API',
      'Design Systems',
      'UX/UI',
      'Acessibilidade (WCAG 2.1 AA)',
      'Performance Web',
      'Responsive Design',
      'Vite',
      'Webpack',
      'Vitest',
      'Jest',
      'React Testing Library',
      'Testes Automatizados',
      'Interfaces para IA (LLMs)',
      'APIs RESTful',
      'C# (.NET Core)',
      'Python',
      'Node.js',
      'Docker',
      'Git',
      'GitHub Actions',
      'Azure DevOps',
      'Microsoft Azure',
      'CI/CD',
      'OWASP Top 10',
      'Metodologias Ágeis'
    ],
    behavioral: [
      'Adaptação a novas tecnologias',
      'Trabalho em equipe',
      'Comunicação clara',
      'Resolução de problemas',
      'Atenção a detalhes'
    ]
  },
  languages: [
    { name: 'Português', level: 'Nativo' },
    { name: 'Inglês', level: 'Intermediário / Leitura e escrita técnica' },
    { name: 'Espanhol', level: 'Intermediário' }
  ],
  certifications: [
    {
      name: 'Azure Cloud Computing Professional Bootcamp',
      issuer: 'IGTI',
      year: '2021'
    },
    {
      name: 'Microsoft Certified: Azure Fundamentals',
      issuer: 'Microsoft',
      year: '2021'
    }
  ]
};
