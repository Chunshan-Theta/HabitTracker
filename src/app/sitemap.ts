import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  "https://go30.zeabur.app";
const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
  ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME)
  : new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = ["", "/sign-in", "/sign-up"];
  const routes = locales.flatMap((locale) =>
    publicPaths.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: buildTime,
    }))
  );

  return routes;
}
