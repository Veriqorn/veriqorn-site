import { Link } from "@tanstack/react-router";
import {
  BrainCircuit,
  Layers3,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/i18n/language-context";
import { messages } from "@/i18n/messages";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const featureIcons = [BrainCircuit, Search, Layers3, Target, Lightbulb, Zap];

const stepIcons = [Workflow, Layers3, BrainCircuit, Lightbulb];

export function HomePage() {
  const { language } = useLanguage();
  const t = messages[language];

  useSeo({
    title: t.seo.homeTitle,
    description: t.seo.homeDescription,
    path: "/",
    language,
    keywords: t.seo.defaultKeywords,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "0",
          priceCurrency: "USD",
          description: "Contact sales for pricing",
        },
      ],
      url: siteConfig.siteUrl,
      description: t.seo.homeDescription,
      inLanguage: language,
    },
  });

  return (
    <div className="space-y-16 pb-16 pt-10 md:space-y-24 md:pt-14">
      {/* HERO */}
      <section className="rounded-2xl border border-border/80 bg-hero-glow p-8 shadow-[0_12px_40px_rgba(4,28,56,0.12)] md:p-12">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t.home.badgeText}
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            {t.home.heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            {t.home.heroDescription}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/docs/$slug"
              params={{ slug: "quick-start-installation" }}
              hash=""
              className={buttonVariants({ size: "lg", className: "shadow-sm" })}
            >
              {t.home.ctaChoosePlan}
            </Link>
            <Link
              to="/docs"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t.home.ctaOpenDocs}
            </Link>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">{t.home.problemTitle}</h2>
          <p className="max-w-4xl text-base text-muted-foreground md:text-lg">
            {t.home.problemDescription}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {t.home.problemPoints.map((point) => (
            <div
              key={point}
              className="rounded-xl border border-border/70 bg-card/80 px-5 py-4 text-muted-foreground"
            >
              {point}
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTION */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">{t.home.solutionTitle}</h2>
          <p className="max-w-4xl text-base text-muted-foreground md:text-lg">
            {t.home.solutionDescription}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {t.home.solutionPoints.map((point) => (
            <div
              key={point}
              className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 font-medium text-foreground"
            >
              {point}
            </div>
          ))}
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">{t.home.mainFeatures.title}</h2>
          <p className="max-w-4xl text-base text-muted-foreground md:text-lg">
            {t.home.mainFeatures.description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.home.mainFeatures.items.map((item, index) => {
            const Icon = featureIcons[index % featureIcons.length];

            return (
              <Card key={item.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">{t.home.howItWorksTitle}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {t.home.howItWorksSteps.map((step, index) => {
            const Icon = stepIcons[index % stepIcons.length];

            return (
              <div
                key={step.title}
                className="relative rounded-xl border border-border/70 bg-card p-5"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mb-1 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">{t.home.differentiationTitle}</h2>
          <p className="max-w-4xl text-base text-muted-foreground md:text-lg">
            {t.home.differentiationDescription}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {t.home.differentiationPoints.map((point) => (
            <Card key={point.before} className="h-full">
              <CardHeader>
                <p className="text-sm text-muted-foreground line-through">{point.before}</p>
                <CardTitle className="text-xl text-primary">{point.after}</CardTitle>
                <CardDescription>{point.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* QUICK BLOCKS */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.home.quickBlocks.quickStartTitle}</CardTitle>
            <CardDescription>{t.home.quickBlocks.quickStartDescription}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.home.quickBlocks.scaleTitle}</CardTitle>
            <CardDescription>{t.home.quickBlocks.scaleDescription}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.home.quickBlocks.docsTitle}</CardTitle>
            <CardDescription>{t.home.quickBlocks.docsDescription}</CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-2xl border border-border/80 bg-card/95 p-6 md:p-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t.home.pilot.title}</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {t.home.pilot.description}
            </p>
          </div>
          <Link
            to="/docs/$slug"
            params={{ slug: "quick-start-installation" }}
            hash=""
            className={buttonVariants({ size: "lg", className: "shrink-0" })}
          >
            {t.home.pilot.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
