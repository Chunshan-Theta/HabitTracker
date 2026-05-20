import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";

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
      ? "Go30：把痛苦的堅持，變成有趣的闖關"
      : "Go30: Turn painful persistence into a fun challenge";
  const description =
    activeLocale === "zh-TW"
      ? "用 Go30 把痛苦的堅持變成像闖關一樣好玩：和夥伴一起打卡、設定專屬獎勵，30 天完成一個挑戰。"
      : "Go30 turns tough persistence into a game: check in with a partner, set rewards, and finish a 30-day challenge together.";
  const canonicalPath = `/${activeLocale}`;

  return {
    title: cardName ? `${cardName} · ${baseTitle}` : baseTitle,
    description,
    openGraph: {
      title: cardName ? `${cardName} · ${baseTitle}` : baseTitle,
      description,
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title: cardName ? `${cardName} · ${baseTitle}` : baseTitle,
      description,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://go30.zeabur.app";
  const activeLocale = locale === "zh-TW" || locale === "en-US" ? locale : "zh-TW";

  if (session) {
    redirect(`/${locale}/dashboard`);
  }

  const nextLocale = activeLocale === "zh-TW" ? "en-US" : "zh-TW";

  const t = await getTranslations();
  const rawBenefits = t.raw("app.benefits");
  const benefits = Array.isArray(rawBenefits)
    ? rawBenefits.filter((item: unknown): item is string => typeof item === "string")
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name:
      activeLocale === "zh-TW"
        ? "Go30：把痛苦的堅持，變成有趣的闖關"
        : "Go30: Turn painful persistence into a fun challenge",
    description:
      activeLocale === "zh-TW"
        ? "用 Go30 把痛苦的堅持變成像闖關一樣好玩：和夥伴一起打卡、設定專屬獎勵，30 天完成一個挑戰。"
        : "Go30 turns tough persistence into a game: check in with a partner, set rewards, and finish a 30-day challenge together.",
    url: `${siteUrl}/${activeLocale}`,
    inLanguage: activeLocale,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#FAF9F6] px-3 pb-16 pt-4 sm:px-4 sm:pt-6">
      <Script
        id="home-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 sm:max-w-4xl sm:gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
          <div className="flex items-center justify-end">
            <a
              href={`/${nextLocale}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {activeLocale === "zh-TW" ? "EN" : "中文"}
            </a>
          </div>
          <h1 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
            {t("app.title")}
          </h1>
          <p className="text-sm text-slate-500">{t("app.description")}</p>
          <p className="text-sm text-slate-500">{t("app.subtitle")}</p>
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            {benefits.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f27c91]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/sign-in`}
              className="rounded-full bg-[#f27c91] px-4 py-2 text-xs font-semibold text-white"
            >
              {t("auth.signIn")}
            </Link>
            <Link
              href={`/${locale}/sign-up`}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              {t("auth.signUp")}
            </Link>
          </div>
        </header>
      </div>
    </main>
  );
}
