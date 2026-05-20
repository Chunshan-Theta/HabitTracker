"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Settings from "@/components/Settings";
import StampCardGrid from "@/components/StampCardGrid";
import type { HabitCard, RewardMap } from "@/types";

const normalizeRewardMap = (rewardMap: RewardMap | null | undefined) => {
  if (!rewardMap) return {} as RewardMap;
  return rewardMap;
};

export default function HomeClient() {
  const t = useTranslations();
  const locale = useLocale();
  const { status } = useSession();
  const [cards, setCards] = useState<HabitCard[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId) ?? cards[0] ?? null,
    [cards, activeCardId]
  );

  const loadCards = async () => {
    const response = await fetch("/api/cards", { cache: "no-store" });
    if (!response.ok) {
      setCards([]);
      return;
    }
    const data = (await response.json()) as HabitCard[];
    setCards(data);
    if (data.length && !activeCardId) {
      setActiveCardId(data[0].id);
    }
    if (!data.length) {
      setCreatingNew(true);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      void loadCards();
    } else if (status === "unauthenticated") {
      setCards([]);
      setActiveCardId(null);
      setCreatingNew(false);
    }
  }, [status]);

  const updateCardState = (updated: HabitCard) => {
    setCards((prev) =>
      prev.map((card) => (card.id === updated.id ? updated : card))
    );
  };

  const handleSaved = (updated: HabitCard) => {
    setCards((prev) => {
      const existing = prev.find((card) => card.id === updated.id);
      if (existing) {
        return prev.map((card) => (card.id === updated.id ? updated : card));
      }
      return [updated, ...prev];
    });
    setActiveCardId(updated.id);
    setCreatingNew(false);
  };

  const handleCycle = (updated: HabitCard) => {
    updateCardState(updated);
  };

  const handleReset = (updated: HabitCard) => {
    updateCardState(updated);
  };

  const rewardMap = normalizeRewardMap(activeCard?.rewardMap);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#FAF9F6] px-3 pb-16 pt-4 sm:px-4 sm:pt-6">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 sm:max-w-4xl sm:gap-6 lg:max-w-6xl">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
          <div className="flex items-center justify-end">
            <Link
              href={`/${locale === "zh-TW" ? "en-US" : "zh-TW"}/dashboard`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {locale === "zh-TW" ? "EN" : "中文"}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
                {t("app.title")}
              </h1>
              <p className="text-sm text-slate-500">
                {t("app.description")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {t("app.subtitle")}
              </p>
              <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500">
                {(t.raw("app.benefits") as string[]).map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#f27c91]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {status === "authenticated" ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                {t("auth.signOut")}
              </button>
            ) : (
              <a
                href={`/${locale}/sign-in`}
                className="rounded-full bg-[#f27c91] px-4 py-2 text-xs font-semibold text-white"
              >
                {t("auth.signIn")}
              </a>
            )}
          </div>

        </header>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="min-w-0 space-y-4 sm:space-y-6">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-[var(--font-display)] text-xl text-[#2f1d1d]">
                  {t("cards.myCards")}
                </h2>
                <button
                  type="button"
                  onClick={() => setCreatingNew(true)}
                  className="rounded-full border border-[#f6a6b2] px-3 py-1 text-xs font-semibold text-[#d14c64]"
                >
                  {t("cards.newCard")}
                </button>
              </div>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2 sm:gap-3">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setActiveCardId(card.id);
                      setCreatingNew(false);
                    }}
                    className={`w-[min(100%,9.5rem)] shrink-0 snap-start rounded-2xl border px-3 py-2.5 text-left shadow-sm transition sm:w-40 sm:px-4 sm:py-3 ${
                      card.id === activeCard?.id
                        ? "border-[#f27c91] bg-[#fff6f7]"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#2f1d1d]">
                      {card.cardName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("cards.points")}: {card.currentPoints}/{card.totalSlots}
                    </p>
                  </button>
                ))}
                {!cards.length && (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
                    {t("settings.title")}
                  </div>
                )}
              </div>
            </div>

            {activeCard && (
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-[var(--font-display)] text-lg text-[#2f1d1d]">
                      {activeCard.cardName}
                    </h3>
                  </div>
                  <div className="rounded-full bg-[#fff6f7] px-4 py-2 text-xs font-semibold text-[#d14c64]">
                    {t("cards.points")}: {activeCard.currentPoints}/
                    {activeCard.totalSlots}
                  </div>
                </div>
                <StampCardGrid
                  className="mt-4"
                  totalSlots={activeCard.totalSlots}
                  currentPoints={activeCard.currentPoints}
                  rewardMap={rewardMap}
                  slotDoodles={activeCard.slotDoodles}
                />
                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#f6a6b2] bg-[#fff6f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2f1d1d]">
                      {t("verify.callout")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("verify.calloutHint")}
                    </p>
                  </div>
                  {status === "authenticated" ? (
                    <Link
                      href={`/${locale}/verify/${activeCard.id}`}
                      className="rounded-full bg-[#f27c91] px-4 py-2 text-xs font-semibold text-white"
                    >
                      {t("app.cta")}
                    </Link>
                  ) : (
                    <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400">
                      {t("errors.notSignedIn")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-4 sm:space-y-6">
            <Settings
              card={creatingNew ? null : activeCard}
              onSaved={handleSaved}
              onNewCycle={handleCycle}
              onReset={handleReset}
            />
          </div>
        </section>
      </div>

    </main>
  );
}
