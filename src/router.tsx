import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { ExternalLink, Github, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { HomePage } from "@/pages/home-page";
import { DocsPage } from "@/pages/docs-page";
import { GuidePage } from "@/pages/guide-page";
import { PricingPage } from "@/pages/pricing-page";
import { DemoPage } from "@/pages/demo-page";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/i18n/language-context";
import { messages } from "@/i18n/messages";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type PublicReleaseManifest = {
  version: string;
  releaseNotesUrl?: string;
};

function PlatformReleaseLinks() {
  const [release, setRelease] = useState<PublicReleaseManifest | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(siteConfig.latestReleaseManifestUrl, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PublicReleaseManifest | null) => setRelease(data))
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const versionLabel = release?.version ?? siteConfig.platformVersion;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
      <a
        href={release?.releaseNotesUrl ?? siteConfig.installRepositoryUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-md px-1 py-1 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="View Veriqorn release notes"
      >
        <Tag className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{versionLabel}</span>
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
      <a
        href={siteConfig.communityRepositoryUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-md px-1 py-1 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Open Veriqorn Community source code on GitHub"
      >
        <Github className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Community</span>
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
      <a
        href={siteConfig.installRepositoryUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-md px-1 py-1 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Open Veriqorn installation repository on GitHub"
      >
        <Github className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Install</span>
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>
  );
}

function RootLayout() {
  const { language, setLanguage } = useLanguage();
  const t = messages[language];
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isDocsRoute = pathname === "/docs" || pathname.startsWith("/docs/");
  const isDemoRoute = pathname === "/demo";

  if (isDemoRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
        <div className="container-shell py-3 md:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <Link to="/" aria-label="Veriqorn home">
                <img src="/logo.png" alt="Veriqorn" className="h-10 w-auto sm:h-12" />
              </Link>

              <Link
                to="/docs/$slug"
                params={{ slug: "quick-start-installation" }}
                hash=""
                className={cn(buttonVariants({ size: "sm" }), "shrink-0 lg:hidden")}
              >
                {t.home.ctaChoosePlan}
              </Link>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Link
                  to="/"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {t.ui.navHome}
                </Link>
                <Link
                  to="/docs"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {t.ui.navDocs}
                </Link>
                <Link
                  to="/pricing"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {t.ui.navPricing}
                </Link>
                <Link
                  to="/demo"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  Demo
                </Link>
              </nav>

              <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                <PlatformReleaseLinks />

                <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-1">
                  <span className="px-1 text-xs font-medium text-slate-400">
                    {t.ui.languageLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLanguage("ru")}
                    className={cn(
                      "rounded px-2 py-1 text-xs font-semibold transition-colors",
                      language === "ru"
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {t.ui.languageRu}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "rounded px-2 py-1 text-xs font-semibold transition-colors",
                      language === "en"
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {t.ui.languageEn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("es")}
                    className={cn(
                      "rounded px-2 py-1 text-xs font-semibold transition-colors",
                      language === "es"
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {t.ui.languageEs}
                  </button>
                </div>

                <Link
                  to="/docs/$slug"
                  params={{ slug: "quick-start-installation" }}
                  hash=""
                  className={cn(buttonVariants({ size: "sm" }), "hidden shrink-0 lg:inline-flex")}
                >
                  {t.home.ctaChoosePlan}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        className={cn(
          isDocsRoute ? "docs-container-shell min-w-0" : "container-shell min-w-0",
        )}
      >
        <Outlet />
      </main>

      <footer className="border-t border-border/70 bg-background/70">
        <div className="container-shell flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Veriqorn</p>
          <p>{t.ui.footerTagline}</p>
        </div>
      </footer>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsPage,
});

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: PricingPage,
});

const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  component: DemoPage,
});

const guideRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  component: GuidePage,
});

const routeTree = rootRoute.addChildren([homeRoute, docsRoute, pricingRoute, demoRoute, guideRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
