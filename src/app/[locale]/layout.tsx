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
  const { locale } = await params;
  const activeLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : "zh-TW";
  return {
    title:
      activeLocale === "zh-TW"
        ? "雙人互動習慣養成集點卡"
        : "Shared Habit Stamp Card",
    description:
      activeLocale === "zh-TW"
        ? "雙人同屏儀式感，讓每日打卡成為甜蜜的共同承諾。"
        : "A ritualized two-person check-in that builds momentum together.",
    openGraph: {
      title:
        activeLocale === "zh-TW"
          ? "雙人互動習慣養成集點卡"
          : "Shared Habit Stamp Card",
      description:
        activeLocale === "zh-TW"
          ? "雙人同屏儀式感，讓每日打卡成為甜蜜的共同承諾。"
          : "A ritualized two-person check-in that builds momentum together.",
    },
    twitter: {
      card: "summary_large_image",
      title:
        activeLocale === "zh-TW"
          ? "雙人互動習慣養成集點卡"
          : "Shared Habit Stamp Card",
      description:
        activeLocale === "zh-TW"
          ? "雙人同屏儀式感，讓每日打卡成為甜蜜的共同承諾。"
          : "A ritualized two-person check-in that builds momentum together.",
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
