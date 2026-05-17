import type { HabitCard as PrismaHabitCard } from "@prisma/client";
import { getSlotDoodlesForCard } from "@/lib/card-doodles";
import type { HabitCard, RewardMap } from "@/types";

const toRewardMap = (value: PrismaHabitCard["rewardMap"]): RewardMap => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const map: RewardMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, string>)) {
    const slot = Number(key);
    if (Number.isFinite(slot) && typeof entry === "string") {
      map[slot] = entry;
    }
  }
  return map;
};

export async function serializeHabitCard(card: PrismaHabitCard): Promise<HabitCard> {
  const slotDoodles = await getSlotDoodlesForCard(card.id, card.cycleStartAt);

  return {
    id: card.id,
    cardName: card.cardName,
    totalSlots: card.totalSlots,
    rewardMap: toRewardMap(card.rewardMap),
    currentPoints: card.currentPoints,
    cycleStartAt: card.cycleStartAt.toISOString(),
    cycleEndAt: card.cycleEndAt.toISOString(),
    status: card.status,
    slotDoodles,
  };
}

export async function serializeHabitCards(
  cards: PrismaHabitCard[]
): Promise<HabitCard[]> {
  return Promise.all(cards.map((card) => serializeHabitCard(card)));
}
