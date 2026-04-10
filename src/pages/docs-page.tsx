import { Link } from "@tanstack/react-router";
import { FileCode2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/i18n/language-context";
import { messages } from "@/i18n/messages";
import { getGuides } from "@/lib/guides";

export function DocsPage() {
  const { language } = useLanguage();
  const t = messages[language];
  const guides = getGuides(language);

  useSeo({
    title: t.seo.docsTitle,
    description: t.seo.docsDescription,
    path: "/docs",
    language,
    keywords: t.seo.defaultKeywords,
  });

  return (
    <div className="space-y-8 pb-16 pt-10 md:pt-12">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold">{t.docs.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{t.docs.description}</p>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <DocsSidebar title={t.docs.sidebarTitle} guides={guides} />

        <section className="grid min-w-0 gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Card key={guide.slug} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-xl">{guide.title}</CardTitle>
                <CardDescription className="line-clamp-3">{guide.summary}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <FileCode2 className="h-3.5 w-3.5" />
                  {guide.slug}.md
                </span>
                <Link
                  to="/docs/$slug"
                  params={{ slug: guide.slug }}
                  hash=""
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {t.docs.openButton}
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
