export type RewardMap = Record<number, string>;

export type SlotDoodleMap = Record<number, string>;

export type HabitCard = {
  id: string;
  cardName: string;
  totalSlots: number;
  rewardMap: RewardMap;
  currentPoints: number;
  cycleStartAt: string;
  cycleEndAt: string;
  status: "active" | "archived";
  slotDoodles: SlotDoodleMap;
};

export type CheckinResult = {
  pointsAfter: number;
  isRewardHit: boolean;
  rewardText?: string | null;
  slotDoodle: string;
};
