import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Link, useParams } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, ChevronLeft, Link2 } from "lucide-react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/i18n/language-context";
import { messages } from "@/i18n/messages";
import {
  getGuideBySlug,
  getGuides,
  type GuideHeading,
  normalizeHeadingText,
  toHeadingId,
} from "@/lib/guides";
import { cn } from "@/lib/utils";

type MarkdownHeadingProps = {
  children?: ReactNode;
  node?: {
    position?: {
      start?: {
        line?: number;
      };
    };
  };
} & HTMLAttributes<HTMLHeadingElement>;

export function GuidePage() {
  const { language } = useLanguage();
  const t = messages[language];
  const { slug } = useParams({ from: "/docs/$slug" });
  const guide = getGuideBySlug(slug, language);
  const guides = getGuides(language);
  const articleRef = useRef<HTMLElement | null>(null);

  useSeo({
    title: guide
      ? `${guide.title} ${t.seo.guideTitleSuffix}`
      : `${t.guide.notFoundTitle} ${t.seo.guideTitleSuffix}`,
    description: t.seo.guideDescription,
    path: `/docs/${slug}`,
    language,
    keywords: t.seo.defaultKeywords,
    noIndex: !guide,
  });

  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>(
    guide?.headings[0]?.id,
  );
  const [copiedHeadingId, setCopiedHeadingId] = useState<string | undefined>(undefined);
  const [pageHeadings, setPageHeadings] = useState<GuideHeading[]>([]);

  const headings = pageHeadings.length > 0 ? pageHeadings : (guide?.headings ?? []);

  useEffect(() => {
    if (!guide || !articleRef.current) {
      setPageHeadings([]);
      return;
    }

    const articleElement = articleRef.current;
    const collectHeadings = () => {
      const renderedHeadings = Array.from(
        articleElement.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
      ).map((element, index) => ({
        id: element.id,
        text: normalizeHeadingText(element.textContent ?? ""),
        level: (element.tagName === "H2" ? 2 : 3) as 2 | 3,
        line: index,
      }));

      setPageHeadings(renderedHeadings);
    };

    const rafId = window.requestAnimationFrame(collectHeadings);
    return () => window.cancelAnimationFrame(rafId);
  }, [guide, language]);

  useEffect(() => {
    if (!guide) {
      return;
    }

    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hashId) {
      setActiveHeadingId(headings[0]?.id);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const hashExistsInCurrentGuide = headings.some((heading) => heading.id === hashId);
    if (!hashExistsInCurrentGuide) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    setActiveHeadingId(hashId);
    window.requestAnimationFrame(() => {
      document.getElementById(hashId)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [guide, headings]);

  useEffect(() => {
    if (!guide || headings.length === 0) {
      return;
    }

    const syncActiveHeadingFromHash = () => {
      const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!hashId) {
        return;
      }

      if (headings.some((heading) => heading.id === hashId)) {
        setActiveHeadingId(hashId);
      }
    };

    window.addEventListener("hashchange", syncActiveHeadingFromHash);

    return () => {
      window.removeEventListener("hashchange", syncActiveHeadingFromHash);
    };
  }, [guide, headings]);

  useEffect(() => {
    if (!guide || headings.length === 0) {
      setActiveHeadingId(undefined);
      return;
    }

    const headingIds = headings.map((heading) => heading.id);

    const getActivationOffset = () => {
      const headerElement = document.querySelector("header");
      const headerHeight = headerElement instanceof HTMLElement ? headerElement.offsetHeight : 64;
      const viewportBias = Math.min(window.innerHeight * 0.28, 220);
      return Math.max(headerHeight + 24, headerHeight + viewportBias);
    };

    const updateFromScrollPosition = () => {
      const activationLine = getActivationOffset();

      const positionedHeadings = headingIds
        .map((id) => {
          const element = document.getElementById(id);
          return element ? { id, top: element.getBoundingClientRect().top } : null;
        })
        .filter((entry): entry is { id: string; top: number } => entry !== null);

      if (positionedHeadings.length === 0) {
        return;
      }

      const nextActiveId =
        [...positionedHeadings].reverse().find((heading) => heading.top <= activationLine)?.id ??
        positionedHeadings[0].id;

      setActiveHeadingId((currentActiveId) =>
        currentActiveId === nextActiveId ? currentActiveId : nextActiveId,
      );
    };

    let isTicking = false;
    const onScroll = () => {
      if (isTicking) {
        return;
      }

      isTicking = true;
      window.requestAnimationFrame(() => {
        updateFromScrollPosition();
        isTicking = false;
      });
    };

    updateFromScrollPosition();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateFromScrollPosition);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateFromScrollPosition);
    };
  }, [guide, headings]);

  if (!guide) {
    return (
      <div className="space-y-6 py-12">
        <h1 className="text-3xl font-bold">{t.guide.notFoundTitle}</h1>
        <p className="text-muted-foreground">{t.guide.notFoundDescription}</p>
        <Link to="/docs" className={buttonVariants({ variant: "outline" })}>
          {t.guide.backToDocs}
        </Link>
      </div>
    );
  }

  const renderedHeadingCounts = new Map<string, number>();

  const flattenHeadingText = (children: ReactNode): string => {
    if (typeof children === "string" || typeof children === "number") {
      return String(children);
    }

    if (Array.isArray(children)) {
      return children.map((child) => flattenHeadingText(child)).join("");
    }

    if (children && typeof children === "object" && "props" in children) {
      return flattenHeadingText((children as { props?: { children?: ReactNode } }).props?.children);
    }

    return "";
  };

  const resolveHeadingId = (tag: "h2" | "h3", children: ReactNode) => {
    const level = tag === "h2" ? 2 : 3;
    const normalizedText = normalizeHeadingText(flattenHeadingText(children));
    const baseId = toHeadingId(normalizedText);

    if (!baseId) {
      return undefined;
    }

    const renderedCount = renderedHeadingCounts.get(baseId) ?? 0;
    renderedHeadingCounts.set(baseId, renderedCount + 1);

    const matchingHeadings = guide.headings.filter(
      (heading) => heading.level === level && toHeadingId(heading.text) === baseId,
    );

    return matchingHeadings[renderedCount]?.id ?? matchingHeadings[0]?.id;
  };

  const copyHeadingLink = async (headingId: string) => {
    const hash = `#${encodeURIComponent(headingId)}`;
    const absoluteUrl = `${window.location.origin}${window.location.pathname}${hash}`;

    let hasCopied = false;

    if (window.isSecureContext && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(absoluteUrl);
        hasCopied = true;
      } catch {
        hasCopied = false;
      }
    }

    if (!hasCopied) {
      const textArea = document.createElement("textarea");
      textArea.value = absoluteUrl;
      textArea.setAttribute("readonly", "true");
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      hasCopied = document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    if (!hasCopied) {
      return;
    }

    setCopiedHeadingId(headingId);
    window.setTimeout(() => {
      setCopiedHeadingId((currentHeadingId) =>
        currentHeadingId === headingId ? undefined : currentHeadingId,
      );
    }, 1400);
  };

  const renderHeading = (
    tag: "h2" | "h3",
    { children, className, node, ...props }: MarkdownHeadingProps,
  ) => {
    const id = resolveHeadingId(tag, children);
    const isCopied = id ? copiedHeadingId === id : false;
    const Tag = tag;

    return (
      <Tag id={id} className={cn("group/heading scroll-mt-24", className)} {...props}>
        <span>{children}</span>
        {id ? (
          <button
            type="button"
            onClick={() => void copyHeadingLink(id)}
            className="ml-1.5 inline-flex h-6 w-6 shrink-0 translate-y-[-1px] items-center justify-center rounded-md border border-transparent text-slate-500 opacity-0 transition-all hover:border-border hover:bg-muted hover:text-primary focus-visible:opacity-100 group-hover/heading:opacity-100"
            aria-label={isCopied ? t.docs.copiedAnchorLabel : t.docs.copyAnchorLabel}
            title={isCopied ? t.docs.copiedAnchorLabel : t.docs.copyAnchorLabel}
          >
            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </Tag>
    );
  };

  return (
    <div className="pb-16 pt-8">
      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)]">
        <DocsSidebar
          title={t.docs.sidebarTitle}
          guides={guides}
          activeSlug={guide.slug}
          onThisPageTitle={t.docs.onThisPage}
          headings={headings}
          activeHeadingId={activeHeadingId}
          onHeadingSelect={setActiveHeadingId}
        />

        <div className="min-w-0 space-y-6">
          <Link
            to="/docs"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full justify-start sm:w-auto" })}
          >
            <ChevronLeft className="h-4 w-4" />
            {t.guide.backToDocs}
          </Link>

          <Card className="overflow-hidden">
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10 xl:py-8">
              <article ref={articleRef} className="markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: (props: MarkdownHeadingProps) => renderHeading("h2", props),
                    h3: (props: MarkdownHeadingProps) => renderHeading("h3", props),
                    table: ({ node, ...props }) => (
                      <div className="table-wrapper">
                        <table {...props} />
                      </div>
                    ),
                  }}
                >
                  {guide.content}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
