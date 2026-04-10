import type { Language } from "@/i18n/language-context";

export type GuideDocument = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  headings: GuideHeading[];
};

export type GuideHeading = {
  id: string;
  text: string;
  level: 2 | 3;
  line: number;
};

const enModules = import.meta.glob("../../docs/guides/en/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const ruModules = import.meta.glob("../../docs/guides/ru/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const esModules = import.meta.glob("../../docs/guides/es/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const modulesByLanguage: Record<Language, Record<string, string>> = {
  en: enModules,
  ru: ruModules,
  es: esModules,
};

/**
 * Explicit display order for guides.
 * Guides not listed here appear at the end, sorted alphabetically.
 */
const GUIDE_ORDER: string[] = [
  "quick-start-installation",
  "system-update-guide",
  "ai-module-overview",
  "ai-llm-connection",
  "ai-repository-indexing",
  "ai-multi-source-repositories",
  "ai-auto-indexing",
  "ai-vector-db-setup",
  "ai-knowledge-base-chat",
  "ai-mcp-server",
  "ai-coverage-intelligence",
  "ai-evidence-connectors",
  "test-rerun-setup",
  "external-connectors",
  "ai-pro-license",
];

export function toHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeHeadingText(rawText: string): string {
  return rawText
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function extractHeadings(markdown: string): GuideHeading[] {
  const lines = markdown.split("\n");
  const usedIds = new Map<string, number>();
  let inCodeFence = false;

  const headings: GuideHeading[] = [];

  for (const [index, line] of lines.entries()) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      continue;
    }

    const match = line.match(/^\s{0,3}(##|###)\s+(.+?)\s*#*\s*$/);
    if (!match) {
      continue;
    }

    const level = match[1].length as 2 | 3;
    const text = normalizeHeadingText(match[2]);
    const baseId = toHeadingId(text);

    if (!text || !baseId) {
      continue;
    }

    const duplicateCount = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, duplicateCount + 1);
    const id = duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount}`;

    headings.push({ id, text, level, line: index + 1 });
  }

  return headings;
}

function toTitleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractSummary(markdown: string): string {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (
      line.startsWith("#") ||
      line.startsWith("```") ||
      line.startsWith("|") ||
      line.startsWith("-") ||
      /^\d+\./.test(line)
    ) {
      continue;
    }

    return line;
  }

  return "";
}

function buildGuides(modules: Record<string, string>): GuideDocument[] {
  const orderIndex = new Map(GUIDE_ORDER.map((slug, i) => [slug, i]));
  const fallbackOrder = GUIDE_ORDER.length;

  return Object.entries(modules)
    .map(([path, content]) => {
      const fileName = path.split("/").pop() ?? "guide.md";
      const slug = fileName.replace(/\.md$/, "");
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1]?.trim() ?? toTitleFromSlug(slug);

      return {
        slug,
        title,
        summary: extractSummary(content),
        content,
        headings: extractHeadings(content),
      };
    })
    .sort((a, b) => {
      const aOrder = orderIndex.get(a.slug) ?? fallbackOrder;
      const bOrder = orderIndex.get(b.slug) ?? fallbackOrder;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.title.localeCompare(b.title);
    });
}

const guidesCache = new Map<Language, GuideDocument[]>();

export function getGuides(language: Language): GuideDocument[] {
  const cached = guidesCache.get(language);
  if (cached) return cached;

  const modules = modulesByLanguage[language];
  const result = buildGuides(modules);
  guidesCache.set(language, result);
  return result;
}

export function getGuideBySlug(slug: string, language: Language): GuideDocument | undefined {
  return getGuides(language).find((guide) => guide.slug === slug);
}
