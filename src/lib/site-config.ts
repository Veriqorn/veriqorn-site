const fallbackSiteUrl = "https://veriqorn.vercel.app";

const envSiteUrl = import.meta.env.VITE_SITE_URL;

const siteUrl =
  typeof envSiteUrl === "string" && envSiteUrl.trim().length > 0
    ? envSiteUrl.trim().replace(/\/+$/, "")
    : fallbackSiteUrl;

export const siteConfig = {
  name: "Veriqorn",
  siteUrl,
};
