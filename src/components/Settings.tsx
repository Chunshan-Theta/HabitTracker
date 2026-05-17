"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { HabitCard, RewardMap } from "@/types";

export type SettingsProps = {
  card?: HabitCard | null;
  onSaved: (card: HabitCard) => void;
  onNewCycle: (card: HabitCard) => void;
  onReset: (card: HabitCard) => void;
};

type RewardRow = { id: string; slot: number; text: string };

const createRewardRow = (slot = 1, text = ""): RewardRow => ({
  id: crypto.randomUUID(),
  slot,
  text,
});

export default function Settings({
  card,
  onSaved,
  onNewCycle,
  onReset,
}: SettingsProps) {
  const t = useTranslations("settings");
  const tErrors = useTranslations("errors");
  const [cardName, setCardName] = useState(card?.cardName ?? "");
  const [totalSlots, setTotalSlots] = useState(card?.totalSlots ?? 30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rewards, setRewards] = useState<RewardRow[]>([]);

  useEffect(() => {
    setCardName(card?.cardName ?? "");
    setTotalSlots(card?.totalSlots ?? 30);
    if (!card?.rewardMap) {
      setRewards([createRewardRow(5, "")]);
      return;
    }
    const nextRewards = Object.entries(card.rewardMap).map(([slot, text]) =>
      createRewardRow(Number(slot), String(text))
    );
    setRewards(nextRewards.length ? nextRewards : [createRewardRow(5, "")]);
  }, [card]);

  const rewardMap = useMemo<RewardMap>(() => {
    const map: RewardMap = {};
    rewards.forEach((reward) => {
      if (reward.slot > 0 && reward.text.trim()) {
        map[reward.slot] = reward.text.trim();
      }
    });
    return map;
  }, [rewards]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        cardName,
        totalSlots,
        rewardMap,
      };
      const response = await fetch(card ? `/api/cards/${card.id}` : "/api/cards", {
        method: card ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError(tErrors("notSignedIn"));
          return;
        }
        throw new Error("save_failed");
      }
      const data = (await response.json()) as HabitCard;
      onSaved(data);
    } catch (err) {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const triggerCycle = async () => {
    if (!card) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/cards/${card.id}/cycle`, {
        method: "POST",
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError(tErrors("notSignedIn"));
          return;
        }
        throw new Error("cycle_failed");
      }
      const data = (await response.json()) as HabitCard;
      onNewCycle(data);
    } catch (err) {
      setError(t("cycleError"));
    } finally {
      setSaving(false);
    }
  };

  const triggerReset = async () => {
    if (!card) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/cards/${card.id}/reset`, {
        method: "POST",
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError(tErrors("notSignedIn"));
          return;
        }
        throw new Error("reset_failed");
      }
      const data = (await response.json()) as HabitCard;
      onReset(data);
    } catch (err) {
      setError(t("resetError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="font-[var(--font-display)] text-xl text-[#2f1d1d]">
          {card ? t("editTitle") : t("title")}
        </h2>
        <p className="text-sm text-slate-500">{t("helper")}</p>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {t("cardName")}
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6a6b2]"
          value={cardName}
          onChange={(event) => setCardName(event.target.value)}
          placeholder={t("placeholderName")}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t("totalSlots")}
        <input
          type="number"
          min={30}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f6a6b2]"
          value={totalSlots}
          onChange={(event) => setTotalSlots(Number(event.target.value))}
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{t("rewards")}</span>
          <button
            type="button"
            className="rounded-full border border-[#f6a6b2] px-3 py-1 text-xs font-semibold text-[#d14c64]"
            onClick={() => setRewards((prev) => [...prev, createRewardRow(5, "")])}
          >
            {t("addReward")}
          </button>
        </div>
        <div className="space-y-2">
          {rewards.map((reward, index) => (
            <div
              key={reward.id}
              className="flex items-center gap-2 rounded-xl bg-[#fff6f7] px-3 py-2"
            >
              <input
                type="number"
                min={1}
                max={totalSlots}
                value={reward.slot}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setRewards((prev) =>
                    prev.map((row, idx) =>
                      idx === index ? { ...row, slot: next } : row
                    )
                  );
                }}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                value={reward.text}
                onChange={(event) => {
                  const next = event.target.value;
                  setRewards((prev) =>
                    prev.map((row, idx) =>
                      idx === index ? { ...row, text: next } : row
                    )
                  );
                }}
                placeholder={t("placeholderReward")}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setRewards((prev) => prev.filter((row) => row.id !== reward.id))
                }
                className="text-xs font-semibold text-slate-500"
              >
                {t("remove")}
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-full bg-[#f27c91] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e7647b] disabled:opacity-60"
        >
          {saving ? t("saving") : t("save")}
        </button>

        {card && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={triggerCycle}
              disabled={saving}
              className="rounded-full border border-[#f6a6b2] px-4 py-2 text-sm font-semibold text-[#d14c64]"
            >
              {t("newCycle")}
            </button>
            <button
              type="button"
              onClick={triggerReset}
              disabled={saving}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {t("reset")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
