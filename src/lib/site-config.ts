const fallbackSiteUrl = "https://veriqorn.vercel.app";

const envSiteUrl = import.meta.env.VITE_SITE_URL;
const envPlatformVersion = import.meta.env.VITE_PLATFORM_VERSION;

const siteUrl =
  typeof envSiteUrl === "string" && envSiteUrl.trim().length > 0
    ? envSiteUrl.trim().replace(/\/+$/, "")
    : fallbackSiteUrl;

const platformVersion =
  typeof envPlatformVersion === "string" && envPlatformVersion.trim().length > 0
    ? envPlatformVersion.trim()
    : "v0.2.7";

export const siteConfig = {
  name: "Veriqorn",
  siteUrl,
  platformVersion,
  communityRepositoryUrl: "https://github.com/Veriqorn/veriqorn",
  installRepositoryUrl: "https://github.com/veriqorn/veriqorn-install",
  latestReleaseManifestUrl:
    "https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/releases/latest.json",
};
