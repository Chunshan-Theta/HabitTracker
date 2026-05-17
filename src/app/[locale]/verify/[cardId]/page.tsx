"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";
import SignatureCanvas from "@/components/SignatureCanvas";
import type { CheckinResult, HabitCard, RewardMap } from "@/types";

const normalizeRewardMap = (rewardMap: RewardMap | null | undefined) => {
  if (!rewardMap) return {} as RewardMap;
  return rewardMap;
};

export default function VerifyPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ cardId: string }>();
  const { status } = useSession();
  const [card, setCard] = useState<HabitCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (rewardModal) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [rewardModal]);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const loadCard = async () => {
      setLoading(true);
      const response = await fetch(`/api/cards/${params.cardId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError(response.status === 404 ? t("errors.selectCard") : t("errors.notSignedIn"));
        setLoading(false);
        return;
      }

      const data = (await response.json()) as HabitCard;
      setCard(data);
      setLoading(false);
    };

    void loadCard();
  }, [params.cardId, status, t]);

  const handleCheckin = async () => {
    if (!card) return;
    setError(null);

    const response = await fetch(`/api/cards/${card.id}/checkin`, {
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

    setCard((prev) =>
      prev
        ? {
            ...prev,
            currentPoints: result.pointsAfter,
          }
        : prev
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

  const rewardMap = useMemo(
    () => normalizeRewardMap(card?.rewardMap),
    [card?.rewardMap]
  );

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              {t("verify.back")}
            </button>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {t("verify.label")}
              </p>
              <h1 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
                {t("verify.title")}
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500">{t("verify.description")}</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-soft)]">
          {loading ? (
            <p className="text-sm text-slate-500">{t("verify.loading")}</p>
          ) : card ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-[#fff6f7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-[var(--font-display)] text-xl text-[#2f1d1d]">
                      {card.cardName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t("cards.points")}: {card.currentPoints}/{card.totalSlots}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#d14c64]">
                    {t("verify.ritualHint")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
                {Array.from({ length: card.totalSlots }, (_, idx) => {
                  const slot = idx + 1;
                  const isFilled = slot <= card.currentPoints;
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

              <div className="rounded-2xl border border-[#f4d5da] bg-white/90 p-4">
                <div className="mb-4">
                  <h3 className="font-[var(--font-display)] text-lg text-[#2f1d1d]">
                    {t("canvas.title")}
                  </h3>
                  <p className="text-sm text-slate-500">{t("canvas.hint")}</p>
                </div>
                <SignatureCanvas
                  resetKey={resetKey}
                  disabled={status !== "authenticated"}
                  disabledMessage={t("errors.notSignedIn")}
                  onComplete={handleCheckin}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("verify.notFound")}</p>
          )}
        </section>
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
