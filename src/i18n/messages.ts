import type { Language } from "./language-context";

export type ComparisonRow = {
  feature: string;
  free: boolean;
  pro: boolean;
};

export type HomeFeatureItem = {
  title: string;
  description: string;
};

export type HowItWorksStep = {
  title: string;
  description: string;
};

export type DifferentiationPoint = {
  before: string;
  after: string;
  description: string;
};

export type AppMessages = {
  ui: {
    navHome: string;
    navDocs: string;
    navBuyPro: string;
    navPricing: string;
    footerTagline: string;
    languageLabel: string;
    languageRu: string;
    languageEn: string;
    languageEs: string;
  };
  home: {
    badgeText: string;
    heroTitle: string;
    heroDescription: string;
    ctaChoosePlan: string;
    ctaOpenDocs: string;
    problemTitle: string;
    problemDescription: string;
    problemPoints: string[];
    solutionTitle: string;
    solutionDescription: string;
    solutionPoints: string[];
    mainFeatures: {
      title: string;
      description: string;
      items: HomeFeatureItem[];
    };
    howItWorksTitle: string;
    howItWorksSteps: HowItWorksStep[];
    differentiationTitle: string;
    differentiationDescription: string;
    differentiationPoints: DifferentiationPoint[];
    pricingTitle: string;
    pricingDescription: string;
    freePlan: {
      title: string;
      description: string;
      price: string;
      cta: string;
      features: string[];
    };
    proPlan: {
      title: string;
      description: string;
      price: string;
      subtitle: string;
      badge: string;
      cta: string;
      features: string[];
    };
    comparison: {
      title: string;
      description: string;
      featureColumn: string;
      freeColumn: string;
      proColumn: string;
      rows: ComparisonRow[];
    };
    quickBlocks: {
      quickStartTitle: string;
      quickStartDescription: string;
      scaleTitle: string;
      scaleDescription: string;
      docsTitle: string;
      docsDescription: string;
      docsCta: string;
    };
    pilot: {
      title: string;
      description: string;
      cta: string;
    };
  };
  docs: {
    title: string;
    description: string;
    openButton: string;
    sidebarTitle: string;
    onThisPage: string;
    copyAnchorLabel: string;
    copiedAnchorLabel: string;
  };
  guide: {
    notFoundTitle: string;
    notFoundDescription: string;
    backToDocs: string;
  };
  seo: {
    homeTitle: string;
    homeDescription: string;
    docsTitle: string;
    docsDescription: string;
    guideTitleSuffix: string;
    guideDescription: string;
    defaultKeywords: string;
  };
};

export const messages: Record<Language, AppMessages> = {
  ru: {
    ui: {
      navHome: "Главная",
      navDocs: "Docs",
      navBuyPro: "Купить Pro",
      navPricing: "Тарифы",
      footerTagline: "Верифицированное качество. Понятные выводы.",
      languageLabel: "Язык",
      languageRu: "RU",
      languageEn: "EN",
      languageEs: "ES",
    },
    home: {
      badgeText: "Verified Quality Reasoning",
      heroTitle:
        "Поймите свои тесты. Объясните падения. Стройте знания с каждого запуска.",
      heroDescription:
        "Veriqorn превращает результаты тестов в понятные выводы — чтобы ваша команда тратила меньше времени на догадки и больше на уверенную разработку.",
      ctaChoosePlan: "Начать бесплатно",
      ctaOpenDocs: "Документация",
      problemTitle: "Результаты тестов — это шум. Контекст теряется.",
      problemDescription:
        "Большинство команд тонут в результатах тестов, не понимая что пошло не так и почему. Знания теряются между запусками.",
      problemPoints: [
        "Падения трудно понять без ручного разбора логов",
        "История тестов есть, но никто не связывает факты между запусками",
        "Знания о причинах падений живут в головах людей, а не в инструментах",
        "Решения о приоритетах основаны на интуиции, а не на данных",
      ],
      solutionTitle: "От результатов — к пониманию",
      solutionDescription:
        "Veriqorn анализирует результаты тестов, объясняет падения в контексте и строит базу знаний, на которую может опираться вся команда.",
      solutionPoints: [
        "Превращает сырые результаты в структурированное понимание",
        "Объясняет падения с доказательствами и анализом причин",
        "Связывает данные между запусками и выявляет паттерны",
        "Строит знания, которые растут с каждым циклом тестирования",
      ],
      mainFeatures: {
        title: "Ключевые возможности",
        description:
          "Всё, что нужно команде, чтобы перейти от шума в результатах тестов к ясному, действенному пониманию.",
        items: [
          {
            title: "Анализ причин падений",
            description:
              "Автоматические гипотезы root cause с объяснениями на основе доказательств. Поймите что упало и почему.",
          },
          {
            title: "Инсайты запусков",
            description:
              "Структурированный анализ каждого прогона. Тренды, паттерны и аномалии — на одном экране.",
          },
          {
            title: "База знаний",
            description:
              "RAG-поиск по истории тестов и кодовой базе. Платформа помнит то, что команда забывает.",
          },
          {
            title: "Root Cause Analysis",
            description:
              "Code-aware анализ, связывающий падения тестов с конкретными изменениями в коде.",
          },
          {
            title: "AI-объяснения",
            description:
              "Понятные контекстные объяснения сложных падений — без ручного разбора стектрейсов.",
          },
          {
            title: "Coverage Intelligence",
            description:
              "Понимание реального покрытия тестами и выявление критических пробелов.",
          },
        ],
      },
      howItWorksTitle: "Как это работает",
      howItWorksSteps: [
        {
          title: "Сбор результатов",
          description: "Автоматический приём данных из ваших CI/CD пайплайнов.",
        },
        {
          title: "Анализ и структурирование",
          description:
            "Парсинг, индексация и связывание результатов с контекстом кодовой базы.",
        },
        {
          title: "Генерация выводов",
          description:
            "Формирование гипотез root cause и объяснений на основе доказательств.",
        },
        {
          title: "Доставка инсайтов",
          description: "Понятные выводы для вашей команды в реальном времени.",
        },
      ],
      differentiationTitle: "Больше, чем отчёты",
      differentiationDescription:
        "Обычные инструменты показывают данные. Veriqorn помогает их понять.",
      differentiationPoints: [
        {
          before: "Отчёты",
          after: "Выводы",
          description:
            "Не просто визуализация результатов. Понимание почему тесты падают и что с этим делать.",
        },
        {
          before: "История",
          after: "Понимание",
          description:
            "Не прокрутка старых запусков. Структурированные инсайты, связывающие прошлое и настоящее.",
        },
        {
          before: "Данные",
          after: "Знания",
          description:
            "Сырые данные устаревают. Знания накапливаются. Стройте растущее понимание вашего тест-сьюта.",
        },
      ],
      pricingTitle: "Тарифы",
      pricingDescription:
        "Начните бесплатно. Подключите полный движок reasoning, когда команда будет готова.",
      freePlan: {
        title: "Free",
        description: "Базовый test intelligence для старта.",
        price: "$0",
        cta: "Начать бесплатно",
        features: [
          "Безлимитный приём результатов тестов",
          "История запусков и анализ трендов",
          "Базовые объяснения падений",
          "Интеграции и уведомления",
        ],
      },
      proPlan: {
        title: "Pro",
        description:
          "Полный движок reasoning с базой знаний и code-aware анализом.",
        price: "По запросу",
        subtitle: "/ команда",
        badge: "Рекомендовано",
        cta: "Связаться с нами",
        features: [
          "Все возможности Free",
          "Глубокий анализ причин падений с root cause",
          "RAG-база знаний",
          "Code-aware индексация репозиториев",
          "Evidence connectors и coverage intelligence",
        ],
      },
      comparison: {
        title: "Free vs Pro",
        description:
          "Базовая платформа бесплатна. Pro открывает полный движок reasoning.",
        featureColumn: "Возможность",
        freeColumn: "Free",
        proColumn: "Pro",
        rows: [
          { feature: "Приём и визуализация результатов тестов", free: true, pro: true },
          { feature: "История запусков и анализ трендов", free: true, pro: true },
          { feature: "Уведомления (Slack / Telegram / Webhook)", free: true, pro: true },
          { feature: "Глубокий анализ причин падений", free: false, pro: true },
          { feature: "Индексация репозиториев + база знаний", free: false, pro: true },
          { feature: "Coverage Intelligence", free: false, pro: true },
          { feature: "Evidence connectors", free: false, pro: true },
        ],
      },
      quickBlocks: {
        quickStartTitle: "Быстрый старт",
        quickStartDescription:
          "Разверните и начните принимать результаты за минуты.",
        scaleTitle: "Масштабируйтесь уверенно",
        scaleDescription:
          "Переходите на Pro, когда команде нужен глубокий reasoning и база знаний.",
        docsTitle: "Документация",
        docsDescription:
          "Технические гайды по установке, настройке и интеграции.",
        docsCta: "Открыть docs",
      },
      pilot: {
        title: "Готовы понять свои тесты?",
        description:
          "Начните строить знания из результатов тестов уже сегодня. Бесплатный старт, мощное масштабирование.",
        cta: "Начать",
      },
    },
    docs: {
      title: "Docs для разработчиков",
      description:
        "Техническая документация по установке, настройке и интеграции Veriqorn.",
      openButton: "Открыть",
      sidebarTitle: "Содержание docs",
      onThisPage: "На этой странице",
      copyAnchorLabel: "Скопировать ссылку на раздел",
      copiedAnchorLabel: "Ссылка скопирована",
    },
    guide: {
      notFoundTitle: "Документ не найден",
      notFoundDescription: "Возможно, файл был переименован или удалён.",
      backToDocs: "Назад к docs",
    },
    seo: {
      homeTitle: "Veriqorn — Verified Quality Reasoning",
      homeDescription:
        "Платформа test intelligence, которая превращает результаты в reasoning. Понимание падений, база знаний, лучшие решения.",
      docsTitle: "Veriqorn Docs — Руководства для разработчиков",
      docsDescription:
        "Техническая документация Veriqorn: установка, настройка AI, индексация репозиториев и evidence connectors.",
      guideTitleSuffix: "— Veriqorn Docs",
      guideDescription:
        "Пошаговое руководство по настройке и запуску Veriqorn.",
      defaultKeywords:
        "veriqorn, test intelligence, анализ падений, аналитика тестов, quality reasoning, инструменты разработчика",
    },
  },
  en: {
    ui: {
      navHome: "Home",
      navDocs: "Docs",
      navBuyPro: "Buy Pro",
      navPricing: "Pricing",
      footerTagline: "Verified quality. Clear reasoning.",
      languageLabel: "Language",
      languageRu: "RU",
      languageEn: "EN",
      languageEs: "ES",
    },
    home: {
      badgeText: "Verified Quality Reasoning",
      heroTitle:
        "Understand your tests. Explain failures. Build knowledge from every run.",
      heroDescription:
        "Veriqorn turns test results into clear reasoning — so your team spends less time guessing and more time shipping with confidence.",
      ctaChoosePlan: "Get started",
      ctaOpenDocs: "Read the docs",
      problemTitle: "Test results are noise. Context is missing.",
      problemDescription:
        "Most teams drown in test output without understanding what went wrong or why. The knowledge disappears between runs.",
      problemPoints: [
        "Failures are hard to understand without digging through logs manually",
        "Test history exists, but nobody connects the dots across runs",
        "Knowledge about why tests fail lives in people's heads, not in your tools",
        "Decisions about what to fix next are based on gut feeling, not data",
      ],
      solutionTitle: "From results to reasoning",
      solutionDescription:
        "Veriqorn analyzes test outcomes, explains failures in context, and builds a knowledge layer your whole team can rely on.",
      solutionPoints: [
        "Turns raw results into structured understanding",
        "Explains failures with evidence and root-cause reasoning",
        "Connects data across runs to surface patterns",
        "Builds knowledge that grows with every test cycle",
      ],
      mainFeatures: {
        title: "Core capabilities",
        description:
          "Everything your team needs to move from noisy test output to clear, actionable understanding.",
        items: [
          {
            title: "Failure Reasoning",
            description:
              "Automatic root-cause hypotheses with evidence-driven explanations. Understand what failed and why.",
          },
          {
            title: "Run Insights",
            description:
              "Structured analysis of every test run. See trends, patterns, and anomalies at a glance.",
          },
          {
            title: "Knowledge Base",
            description:
              "RAG-powered retrieval across your test history and codebase. The platform remembers what your team forgets.",
          },
          {
            title: "Root Cause Analysis",
            description:
              "Code-aware analysis that connects test failures to the exact changes that caused them.",
          },
          {
            title: "AI-Assisted Explanations",
            description:
              "Clear, contextual explanations of complex failures — no more deciphering stack traces alone.",
          },
          {
            title: "Coverage Intelligence",
            description:
              "Understand what your tests actually cover and where the critical gaps are.",
          },
        ],
      },
      howItWorksTitle: "How it works",
      howItWorksSteps: [
        {
          title: "Collect results",
          description:
            "Ingest test data from your CI/CD pipelines automatically.",
        },
        {
          title: "Analyze & structure",
          description:
            "Parse, index, and connect results with your codebase context.",
        },
        {
          title: "Generate reasoning",
          description:
            "Produce root-cause hypotheses and evidence-based explanations.",
        },
        {
          title: "Deliver insights",
          description:
            "Surface actionable understanding to your team in real time.",
        },
      ],
      differentiationTitle: "Beyond reporting",
      differentiationDescription:
        "Traditional tools show you data. Veriqorn helps you understand it.",
      differentiationPoints: [
        {
          before: "Reports",
          after: "Reasoning",
          description:
            "Go beyond visualizing results. Understand why tests fail and what to do about it.",
        },
        {
          before: "History",
          after: "Understanding",
          description:
            "Stop scrolling through old runs. Get structured insights that connect past and present.",
        },
        {
          before: "Data",
          after: "Knowledge",
          description:
            "Raw data fades. Knowledge compounds. Build an ever-growing understanding of your test suite.",
        },
      ],
      pricingTitle: "Pricing",
      pricingDescription:
        "Start free. Add reasoning capabilities when your team is ready.",
      freePlan: {
        title: "Free",
        description: "Core test intelligence for teams getting started.",
        price: "$0",
        cta: "Get started free",
        features: [
          "Unlimited test result ingestion",
          "Run history and trend analysis",
          "Basic failure explanations",
          "Integrations and notifications",
        ],
      },
      proPlan: {
        title: "Pro",
        description:
          "Full reasoning engine with knowledge base and code-aware analysis.",
        price: "Custom",
        subtitle: "/ team",
        badge: "Recommended",
        cta: "Contact us",
        features: [
          "Everything in Free",
          "Deep failure reasoning with root-cause analysis",
          "RAG-powered knowledge base",
          "Code-aware repository indexing",
          "Evidence connectors and coverage intelligence",
        ],
      },
      comparison: {
        title: "Free vs Pro",
        description:
          "The core platform is free. Pro unlocks the full reasoning engine.",
        featureColumn: "Capability",
        freeColumn: "Free",
        proColumn: "Pro",
        rows: [
          { feature: "Test result ingestion and visualization", free: true, pro: true },
          { feature: "Run history and trend analysis", free: true, pro: true },
          { feature: "Notifications (Slack / Telegram / Webhook)", free: true, pro: true },
          { feature: "Deep failure reasoning", free: false, pro: true },
          { feature: "Repository indexing + knowledge base", free: false, pro: true },
          { feature: "Coverage Intelligence", free: false, pro: true },
          { feature: "Evidence connectors", free: false, pro: true },
        ],
      },
      quickBlocks: {
        quickStartTitle: "Quick start",
        quickStartDescription:
          "Deploy and start ingesting results in minutes.",
        scaleTitle: "Scale with confidence",
        scaleDescription:
          "Upgrade to Pro when your team needs deeper reasoning and knowledge.",
        docsTitle: "Documentation",
        docsDescription:
          "Technical guides for setup, configuration, and integration.",
        docsCta: "Open docs",
      },
      pilot: {
        title: "Ready to understand your tests?",
        description:
          "Start building knowledge from your test results today. Free to begin, powerful to scale.",
        cta: "Get started",
      },
    },
    docs: {
      title: "Developer Docs",
      description:
        "Technical documentation for Veriqorn setup, configuration, and integration.",
      openButton: "Open",
      sidebarTitle: "Docs navigation",
      onThisPage: "On this page",
      copyAnchorLabel: "Copy section link",
      copiedAnchorLabel: "Section link copied",
    },
    guide: {
      notFoundTitle: "Document not found",
      notFoundDescription: "The file may have been renamed or removed.",
      backToDocs: "Back to docs",
    },
    seo: {
      homeTitle: "Veriqorn — Verified Quality Reasoning",
      homeDescription:
        "Test intelligence platform that turns results into reasoning. Understand failures, build knowledge, make better decisions.",
      docsTitle: "Veriqorn Docs — Developer guides",
      docsDescription:
        "Technical documentation for Veriqorn: setup, AI configuration, repository indexing, and evidence connectors.",
      guideTitleSuffix: "— Veriqorn Docs",
      guideDescription:
        "Step-by-step guide for configuring and running Veriqorn.",
      defaultKeywords:
        "veriqorn, test intelligence, failure reasoning, test analytics, quality reasoning, developer tools",
    },
  },
  es: {
    ui: {
      navHome: "Inicio",
      navDocs: "Docs",
      navBuyPro: "Comprar Pro",
      navPricing: "Precios",
      footerTagline: "Calidad verificada. Razonamiento claro.",
      languageLabel: "Idioma",
      languageRu: "RU",
      languageEn: "EN",
      languageEs: "ES",
    },
    home: {
      badgeText: "Verified Quality Reasoning",
      heroTitle:
        "Entiende tus tests. Explica los fallos. Construye conocimiento con cada ejecución.",
      heroDescription:
        "Veriqorn convierte los resultados de tests en razonamiento claro — para que tu equipo pase menos tiempo adivinando y más tiempo entregando con confianza.",
      ctaChoosePlan: "Comenzar gratis",
      ctaOpenDocs: "Leer la documentación",
      problemTitle: "Los resultados son ruido. Falta contexto.",
      problemDescription:
        "La mayoría de los equipos se ahogan en resultados de tests sin entender qué salió mal ni por qué. El conocimiento desaparece entre ejecuciones.",
      problemPoints: [
        "Los fallos son difíciles de entender sin revisar logs manualmente",
        "El historial de tests existe, pero nadie conecta los puntos entre ejecuciones",
        "El conocimiento sobre por qué fallan los tests vive en las cabezas de las personas, no en las herramientas",
        "Las decisiones sobre qué arreglar se basan en intuición, no en datos",
      ],
      solutionTitle: "De resultados a razonamiento",
      solutionDescription:
        "Veriqorn analiza los resultados, explica los fallos en contexto y construye una capa de conocimiento en la que todo tu equipo puede confiar.",
      solutionPoints: [
        "Convierte resultados crudos en comprensión estructurada",
        "Explica fallos con evidencia y análisis de causa raíz",
        "Conecta datos entre ejecuciones para descubrir patrones",
        "Construye conocimiento que crece con cada ciclo de testing",
      ],
      mainFeatures: {
        title: "Capacidades principales",
        description:
          "Todo lo que tu equipo necesita para pasar del ruido en los resultados a una comprensión clara y accionable.",
        items: [
          {
            title: "Razonamiento de fallos",
            description:
              "Hipótesis automáticas de causa raíz con explicaciones basadas en evidencia. Entiende qué falló y por qué.",
          },
          {
            title: "Insights de ejecución",
            description:
              "Análisis estructurado de cada ejecución. Tendencias, patrones y anomalías de un vistazo.",
          },
          {
            title: "Base de conocimiento",
            description:
              "Búsqueda RAG sobre tu historial de tests y código. La plataforma recuerda lo que tu equipo olvida.",
          },
          {
            title: "Análisis de causa raíz",
            description:
              "Análisis code-aware que conecta fallos de tests con los cambios exactos que los causaron.",
          },
          {
            title: "Explicaciones con IA",
            description:
              "Explicaciones claras y contextuales de fallos complejos — sin descifrar stack traces solo.",
          },
          {
            title: "Coverage Intelligence",
            description:
              "Comprende qué cubren realmente tus tests y dónde están las brechas críticas.",
          },
        ],
      },
      howItWorksTitle: "Cómo funciona",
      howItWorksSteps: [
        {
          title: "Recolectar resultados",
          description:
            "Ingesta automática de datos desde tus pipelines CI/CD.",
        },
        {
          title: "Analizar y estructurar",
          description:
            "Parsear, indexar y conectar resultados con el contexto de tu código.",
        },
        {
          title: "Generar razonamiento",
          description:
            "Producir hipótesis de causa raíz y explicaciones basadas en evidencia.",
        },
        {
          title: "Entregar insights",
          description:
            "Comprensión accionable para tu equipo en tiempo real.",
        },
      ],
      differentiationTitle: "Más allá de los reportes",
      differentiationDescription:
        "Las herramientas tradicionales muestran datos. Veriqorn te ayuda a entenderlos.",
      differentiationPoints: [
        {
          before: "Reportes",
          after: "Razonamiento",
          description:
            "Más que visualizar resultados. Entiende por qué fallan los tests y qué hacer al respecto.",
        },
        {
          before: "Historial",
          after: "Comprensión",
          description:
            "Deja de revisar ejecuciones pasadas. Obtén insights estructurados que conectan pasado y presente.",
        },
        {
          before: "Datos",
          after: "Conocimiento",
          description:
            "Los datos crudos se desvanecen. El conocimiento se acumula. Construye una comprensión creciente de tu suite de tests.",
        },
      ],
      pricingTitle: "Precios",
      pricingDescription:
        "Empieza gratis. Agrega capacidades de razonamiento cuando tu equipo esté listo.",
      freePlan: {
        title: "Free",
        description: "Test intelligence básico para equipos que están empezando.",
        price: "$0",
        cta: "Comenzar gratis",
        features: [
          "Ingesta ilimitada de resultados de tests",
          "Historial de ejecuciones y análisis de tendencias",
          "Explicaciones básicas de fallos",
          "Integraciones y notificaciones",
        ],
      },
      proPlan: {
        title: "Pro",
        description:
          "Motor de razonamiento completo con base de conocimiento y análisis code-aware.",
        price: "A consultar",
        subtitle: "/ equipo",
        badge: "Recomendado",
        cta: "Contáctanos",
        features: [
          "Todo lo incluido en Free",
          "Razonamiento profundo de fallos con análisis de causa raíz",
          "Base de conocimiento RAG",
          "Indexación code-aware de repositorios",
          "Conectores de evidencia y coverage intelligence",
        ],
      },
      comparison: {
        title: "Free vs Pro",
        description:
          "La plataforma base es gratis. Pro desbloquea el motor de razonamiento completo.",
        featureColumn: "Funcionalidad",
        freeColumn: "Free",
        proColumn: "Pro",
        rows: [
          { feature: "Ingesta y visualización de resultados", free: true, pro: true },
          { feature: "Historial de ejecuciones y análisis de tendencias", free: true, pro: true },
          { feature: "Notificaciones (Slack / Telegram / Webhook)", free: true, pro: true },
          { feature: "Razonamiento profundo de fallos", free: false, pro: true },
          { feature: "Indexación de repositorios + base de conocimiento", free: false, pro: true },
          { feature: "Coverage Intelligence", free: false, pro: true },
          { feature: "Conectores de evidencia", free: false, pro: true },
        ],
      },
      quickBlocks: {
        quickStartTitle: "Inicio rápido",
        quickStartDescription:
          "Despliega y comienza a ingestar resultados en minutos.",
        scaleTitle: "Escala con confianza",
        scaleDescription:
          "Pasa a Pro cuando tu equipo necesite razonamiento más profundo y base de conocimiento.",
        docsTitle: "Documentación",
        docsDescription:
          "Guías técnicas de instalación, configuración e integración.",
        docsCta: "Abrir docs",
      },
      pilot: {
        title: "¿Listo para entender tus tests?",
        description:
          "Comienza a construir conocimiento desde tus resultados de tests hoy. Gratis para empezar, potente para escalar.",
        cta: "Comenzar",
      },
    },
    docs: {
      title: "Docs para desarrolladores",
      description:
        "Documentación técnica para la instalación, configuración e integración de Veriqorn.",
      openButton: "Abrir",
      sidebarTitle: "Navegación de docs",
      onThisPage: "En esta página",
      copyAnchorLabel: "Copiar enlace de sección",
      copiedAnchorLabel: "Enlace de sección copiado",
    },
    guide: {
      notFoundTitle: "Documento no encontrado",
      notFoundDescription:
        "Es posible que el archivo haya sido renombrado o eliminado.",
      backToDocs: "Volver a docs",
    },
    seo: {
      homeTitle: "Veriqorn — Verified Quality Reasoning",
      homeDescription:
        "Plataforma de test intelligence que convierte resultados en razonamiento. Comprende fallos, construye conocimiento, toma mejores decisiones.",
      docsTitle: "Veriqorn Docs — Guías para desarrolladores",
      docsDescription:
        "Documentación técnica de Veriqorn: instalación, configuración de IA, indexación de repositorios y conectores de evidencia.",
      guideTitleSuffix: "— Veriqorn Docs",
      guideDescription:
        "Guía paso a paso para configurar y ejecutar Veriqorn.",
      defaultKeywords:
        "veriqorn, test intelligence, razonamiento de fallos, analítica de tests, quality reasoning, herramientas para desarrolladores",
    },
  },
};
