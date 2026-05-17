import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cardName?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { cardName } = await searchParams;
  const activeLocale = locale === "zh-TW" || locale === "en-US" ? locale : "zh-TW";
  const baseTitle =
    activeLocale === "zh-TW"
      ? "雙人互動習慣養成集點卡"
      : "Shared Habit Stamp Card";
  const description =
    activeLocale === "zh-TW"
      ? "雙人同屏儀式感，讓每日打卡成為甜蜜的共同承諾。"
      : "A ritualized two-person check-in that builds momentum together.";

  return {
    title: cardName ? `${cardName} · ${baseTitle}` : baseTitle,
    description,
    openGraph: {
      title: cardName ? `${cardName} · ${baseTitle}` : baseTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: cardName ? `${cardName} · ${baseTitle}` : baseTitle,
      description,
    },
  };
}

export default function HomePage() {
  return <HomeClient />;
}
