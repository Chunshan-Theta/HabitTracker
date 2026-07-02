import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/routing";
import Providers from "@/components/Providers";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://go30.zeabur.app";
  const { locale } = await params;
  const activeLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "zh-TW";
  const baseTitle =
    activeLocale === "zh-TW"
      ? "Go30：把痛苦的堅持，變成有趣的闖關"
      : "Go30: Turn painful persistence into a fun challenge";
  const description =
    activeLocale === "zh-TW"
      ? "用 Go30 把痛苦的堅持變成像闖關一樣好玩：和夥伴一起打卡、設定專屬獎勵，慢慢累積每一格成就。"
      : "Go30 turns tough persistence into a game: check in with a partner, set rewards, and build progress stamp by stamp.";
  const canonicalPath = `/${activeLocale}`;
  return {
    metadataBase: new URL(siteUrl),
    title: baseTitle,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "zh-TW": "/zh-TW",
        "en-US": "/en-US",
      },
    },
    openGraph: {
      title: baseTitle,
      description,
      url: canonicalPath,
      siteName: "Go30",
      locale: activeLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: baseTitle,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "zh-TW";
  setRequestLocale(activeLocale);
  const messages = await getMessages();

  return (
    <Providers locale={activeLocale} messages={messages}>
      {children}
    </Providers>
  );
}
