import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bot, ChartNoAxesCombined } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/i18n/language-context";
import { messages } from "@/i18n/messages";

function FeatureCheck({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
      <BadgeCheck className="h-4 w-4" />
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
      —
    </span>
  );
}

export function PricingPage() {
  const { language } = useLanguage();
  const t = messages[language];

  useSeo({
    title: `${t.home.pricingTitle} — Veriqorn`,
    description: t.home.pricingDescription,
    path: "/pricing",
    language,
    keywords: t.seo.defaultKeywords,
  });

  return (
    <div className="space-y-12 pb-16 pt-10 md:space-y-16 md:pt-14">
      <section className="rounded-2xl border border-border/80 bg-hero-glow p-6 shadow-[0_12px_40px_rgba(4,28,56,0.08)] md:p-8">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold">{t.home.pricingTitle}</h1>
          <p className="max-w-3xl text-muted-foreground">{t.home.pricingDescription}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/docs/$slug"
              params={{ slug: "quick-start-installation" }}
              hash=""
              className={buttonVariants({ size: "lg" })}
            >
              {t.home.freePlan.cta}
            </Link>
            <Link
              to="/docs/$slug"
              params={{ slug: "ai-pro-license" }}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t.home.proPlan.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ChartNoAxesCombined className="h-5 w-5 text-primary" />
                {t.home.freePlan.title}
              </CardTitle>
              <CardDescription>{t.home.freePlan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-4xl font-bold">{t.home.freePlan.price}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t.home.freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link
                to="/docs/$slug"
                params={{ slug: "quick-start-installation" }}
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                {t.home.freePlan.cta}
              </Link>
            </CardFooter>
          </Card>

          <Card className="relative h-full border-primary/40">
            <div className="absolute right-6 top-4">
              <Badge>{t.home.proPlan.badge}</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bot className="h-5 w-5 text-primary" />
                {t.home.proPlan.title}
              </CardTitle>
              <CardDescription>{t.home.proPlan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-4xl font-bold">
                {t.home.proPlan.price}
                <span className="ml-2 text-base font-medium text-muted-foreground">
                  {t.home.proPlan.subtitle}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t.home.proPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link
                to="/docs/$slug"
                params={{ slug: "ai-pro-license" }}
                className={buttonVariants({ className: "w-full" })}
              >
                {t.home.proPlan.cta}
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">{t.home.comparison.title}</h2>
          <p className="max-w-3xl text-muted-foreground">{t.home.comparison.description}</p>
        </div>

        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full min-w-[480px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 font-semibold">
                    {t.home.comparison.featureColumn}
                  </th>
                  <th className="border-b border-border px-4 py-3 text-center font-semibold">
                    {t.home.comparison.freeColumn}
                  </th>
                  <th className="border-b border-border px-4 py-3 text-center font-semibold">
                    {t.home.comparison.proColumn}
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.home.comparison.rows.map((row) => (
                  <tr key={row.feature}>
                    <td className="border-b border-border/70 px-4 py-3 text-muted-foreground">
                      {row.feature}
                    </td>
                    <td className="border-b border-border/70 px-4 py-3 text-center">
                      <FeatureCheck enabled={row.free} />
                    </td>
                    <td className="border-b border-border/70 px-4 py-3 text-center">
                      <FeatureCheck enabled={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/95 p-6 md:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t.home.pilot.title}</h2>
            <p className="mt-2 text-muted-foreground">{t.home.pilot.description}</p>
          </div>
          <Link
            to="/docs/$slug"
            params={{ slug: "ai-pro-license" }}
            className={buttonVariants({ size: "lg", className: "shrink-0" })}
          >
            {t.home.pilot.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
