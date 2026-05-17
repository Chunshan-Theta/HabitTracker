"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { signOut, useSession } from "next-auth/react";
import SignatureCanvas from "@/components/SignatureCanvas";
import Settings from "@/components/Settings";
import type { CheckinResult, HabitCard, RewardMap } from "@/types";

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
  const [toast, setToast] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

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

  useEffect(() => {
    if (rewardModal) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [rewardModal]);

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
    setResetKey((prev) => prev + 1);
  };

  const handleReset = (updated: HabitCard) => {
    updateCardState(updated);
    setResetKey((prev) => prev + 1);
  };

  const handleCheckin = async () => {
    if (!activeCard) return;
    setError(null);

    const response = await fetch(`/api/cards/${activeCard.id}/checkin`, {
      method: "POST",
    });

    if (!response.ok) {
      const result = await response.json();
      const errorMessage =
        result.error === "Cycle expired"
          ? t("errors.cardExpired")
          : result.error === "Card complete"
            ? t("errors.cardComplete")
            : result.error === "Unauthorized"
              ? t("errors.notSignedIn")
              : result.error ?? t("errors.cardExpired");
      setError(errorMessage);
      setResetKey((prev) => prev + 1);
      return;
    }

    const result = (await response.json()) as CheckinResult;
    const rewardText = result.rewardText ?? undefined;

    setCards((prev) =>
      prev.map((card) =>
        card.id === activeCard.id
          ? { ...card, currentPoints: result.pointsAfter }
          : card
      )
    );

    if (result.isRewardHit && rewardText) {
      setRewardModal(rewardText);
    } else {
      const encouragements = t.raw("toast.encouragements") as string[];
      const message =
        encouragements[Math.floor(Math.random() * encouragements.length)];
      setToast(message);
      setTimeout(() => {
        setToast(null);
        setResetKey((prev) => prev + 1);
      }, 1500);
    }
  };

  const rewardMap = normalizeRewardMap(activeCard?.rewardMap);

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
                {t("app.title")}
              </h1>
              <p className="text-sm text-slate-500">
                {t("app.description")}
              </p>
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
          <div className="rounded-2xl border border-dashed border-[#f6a6b2] bg-[#fff6f7] px-4 py-3 text-center text-xs font-semibold text-[#d14c64]">
            {t("ads.header")}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)]">
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
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setActiveCardId(card.id);
                      setCreatingNew(false);
                    }}
                    className={`min-w-[180px] rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
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
              <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-[var(--font-display)] text-lg text-[#2f1d1d]">
                      {activeCard.cardName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t("cards.cycleEnds")} {" "}
                      {new Date(activeCard.cycleEndAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#fff6f7] px-4 py-2 text-xs font-semibold text-[#d14c64]">
                    {t("cards.points")}: {activeCard.currentPoints}/
                    {activeCard.totalSlots}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-6">
                  {Array.from({ length: activeCard.totalSlots }, (_, idx) => {
                    const slot = idx + 1;
                    const isFilled = slot <= activeCard.currentPoints;
                    const rewardText = rewardMap[slot];
                    return (
                      <div
                        key={slot}
                        className={`relative flex aspect-square items-center justify-center rounded-2xl border text-xs font-semibold ${
                          rewardText
                            ? "border-[#f6a6b2] bg-[#fff0f3] shadow-[0_0_12px_rgba(242,124,145,0.4)]"
                            : "border-slate-100 bg-white"
                        }`}
                      >
                        <span
                          className={`h-6 w-6 rounded-full border-2 ${
                            isFilled
                              ? "border-[#f27c91] bg-[#f27c91]"
                              : "border-slate-200"
                          }`}
                        />
                        {rewardText && (
                          <span className="absolute -top-2 right-1 text-lg">🎁</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4">
                <h3 className="font-[var(--font-display)] text-lg text-[#2f1d1d]">
                  {t("canvas.title")}
                </h3>
                <p className="text-sm text-slate-500">{t("canvas.hint")}</p>
              </div>
              <SignatureCanvas
                resetKey={resetKey}
                disabled={status !== "authenticated" || !activeCard}
                disabledMessage={
                  status !== "authenticated"
                    ? t("errors.notSignedIn")
                    : t("errors.selectCard")
                }
                onComplete={handleCheckin}
              />
            </div>
          </div>

          <div className="space-y-6">
            <Settings
              card={creatingNew ? null : activeCard}
              onSaved={handleSaved}
              onNewCycle={handleCycle}
              onReset={handleReset}
            />
          </div>
        </section>

        <footer className="rounded-2xl border border-dashed border-[#f6a6b2] bg-[#fff6f7] px-4 py-3 text-center text-xs font-semibold text-[#d14c64]">
          {t("ads.footer")}
        </footer>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-md -translate-x-1/2 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-[#2f1d1d] shadow-[var(--shadow-soft)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rewardModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#fef4f6]/90 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[var(--shadow-soft)]"
            >
              <h3 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
                {t("modal.rewardUnlocked")}
              </h3>
              <p className="mt-3 text-lg font-semibold text-[#d14c64]">
                {rewardModal}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRewardModal(null);
                  setResetKey((prev) => prev + 1);
                }}
                className="mt-6 w-full rounded-full bg-[#f27c91] px-4 py-3 text-sm font-semibold text-white"
              >
                {t("modal.confirm")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
