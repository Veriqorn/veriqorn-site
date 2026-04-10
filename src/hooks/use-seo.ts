import { useEffect } from "react";
import type { Language } from "@/i18n/language-context";
import { siteConfig } from "@/lib/site-config";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  language: Language;
  keywords: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
};

const structuredDataScriptId = "structured-data";

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let metaTag = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!metaTag) {
    metaTag = document.createElement("meta");
    metaTag.setAttribute(attribute, key);
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute("content", content);
}

function upsertCanonicalLink(href: string) {
  let canonicalLink = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }

  canonicalLink.setAttribute("href", href);
}

function upsertAlternateLink(hreflang: string, href: string) {
  const selector = `link[rel="alternate"][hreflang="${hreflang}"]`;
  let alternateLink = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!alternateLink) {
    alternateLink = document.createElement("link");
    alternateLink.setAttribute("rel", "alternate");
    alternateLink.setAttribute("hreflang", hreflang);
    document.head.appendChild(alternateLink);
  }

  alternateLink.setAttribute("href", href);
}

function upsertStructuredData(data?: Record<string, unknown>) {
  const existing = document.getElementById(structuredDataScriptId);

  if (!data) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  let script = existing as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement("script");
    script.id = structuredDataScriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

export function useSeo({
  title,
  description,
  path,
  language,
  keywords,
  noIndex,
  structuredData,
}: SeoOptions) {
  useEffect(() => {
    const normalizedPath = normalizePath(path);
    const canonicalUrl = `${siteConfig.siteUrl}${normalizedPath}`;
    const locale = language === "ru" ? "ru_RU" : "en_US";

    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertMeta("name", "language", language);

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", siteConfig.name);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:locale", locale);
    upsertMeta("property", "og:image", `${siteConfig.siteUrl}/og-cover.svg`);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", `${siteConfig.siteUrl}/og-cover.svg`);

    upsertCanonicalLink(canonicalUrl);
    upsertAlternateLink("ru", canonicalUrl);
    upsertAlternateLink("en", canonicalUrl);
    upsertAlternateLink("x-default", canonicalUrl);
    upsertStructuredData(structuredData);
  }, [description, keywords, language, noIndex, path, structuredData, title]);
}
