import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;

  if (session) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations();

  return (
    <main className="min-h-screen overflow-x-clip bg-[#FAF9F6] px-3 pb-16 pt-4 sm:px-4 sm:pt-6">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 sm:max-w-4xl sm:gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
          <div className="flex items-center justify-end">
            <Link
              href={`/${locale === "zh-TW" ? "en-US" : "zh-TW"}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {locale === "zh-TW" ? "EN" : "中文"}
            </Link>
          </div>
          <h1 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
            {t("app.title")}
          </h1>
          <p className="text-sm text-slate-500">{t("app.description")}</p>
          <p className="text-sm text-slate-500">{t("app.subtitle")}</p>
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            {(t.raw("app.benefits") as string[]).map((item) => (
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
