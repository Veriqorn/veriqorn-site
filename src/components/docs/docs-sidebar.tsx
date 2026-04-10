import { useEffect, useRef, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { type GuideDocument, type GuideHeading } from "@/lib/guides";
import { cn } from "@/lib/utils";

type DocsSidebarProps = {
  title: string;
  guides: GuideDocument[];
  activeSlug?: string;
  onThisPageTitle?: string;
  headings?: GuideHeading[];
  activeHeadingId?: string;
  onHeadingSelect?: (headingId: string) => void;
};

export function DocsSidebar({
  title,
  guides,
  activeSlug,
  onThisPageTitle,
  headings = [],
  activeHeadingId,
  onHeadingSelect,
}: DocsSidebarProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onThisPageRef = useRef<HTMLUListElement | null>(null);

  const handleHeadingClick = (event: MouseEvent<HTMLAnchorElement>, headingId: string) => {
    event.preventDefault();

    const headingElement = document.getElementById(headingId);
    if (!headingElement) {
      return;
    }

    headingElement.scrollIntoView({ behavior: "smooth", block: "start" });
    onHeadingSelect?.(headingId);
    window.history.replaceState(null, "", `#${encodeURIComponent(headingId)}`);
  };

  useEffect(() => {
    if (!activeHeadingId || !onThisPageRef.current || !panelRef.current) {
      return;
    }

    const activeLink = onThisPageRef.current.querySelector<HTMLElement>(
      `[data-heading-id="${CSS.escape(activeHeadingId)}"]`,
    );

    if (!activeLink) {
      return;
    }

    const panel = panelRef.current;
    const padding = 12;
    const linkTop = activeLink.offsetTop;
    const linkBottom = linkTop + activeLink.offsetHeight;
    const viewportTop = panel.scrollTop;
    const viewportBottom = viewportTop + panel.clientHeight;

    if (linkTop - padding < viewportTop) {
      panel.scrollTo({ top: Math.max(0, linkTop - padding), behavior: "smooth" });
      return;
    }

    if (linkBottom + padding > viewportBottom) {
      panel.scrollTo({
        top: Math.max(0, linkBottom - panel.clientHeight + padding),
        behavior: "smooth",
      });
    }
  }, [activeHeadingId]);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div
        ref={panelRef}
        className="space-y-5 rounded-xl border border-border/80 bg-card/90 p-4 shadow-[0_8px_28px_rgba(2,32,71,0.08)] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2"
      >
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
          <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                to="/docs/$slug"
                params={{ slug: guide.slug }}
                hash=""
                className={cn(
                  "block rounded-md px-2 py-1.5 text-sm transition-colors",
                  activeSlug === guide.slug
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {guide.title}
              </Link>
            ))}
          </nav>
        </div>

        {activeSlug && headings.length > 0 && onThisPageTitle ? (
          <div className="space-y-2 border-t border-border/70 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {onThisPageTitle}
            </h3>
            <ul ref={onThisPageRef} className="space-y-1">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${encodeURIComponent(heading.id)}`}
                    onClick={(event) => handleHeadingClick(event, heading.id)}
                    data-heading-id={heading.id}
                    className={cn(
                      "block rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      activeHeadingId === heading.id &&
                        "bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary",
                      heading.level === 3 && "pl-5",
                    )}
                    aria-current={activeHeadingId === heading.id ? "location" : undefined}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
