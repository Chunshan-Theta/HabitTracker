import type { RewardMap, SlotDoodleMap } from "@/types";

type StampCardGridProps = {
  totalSlots: number;
  currentPoints: number;
  rewardMap: RewardMap;
  slotDoodles?: SlotDoodleMap;
  className?: string;
};

export default function StampCardGrid({
  totalSlots,
  currentPoints,
  rewardMap,
  slotDoodles = {},
  className = "",
}: StampCardGridProps) {
  return (
    <div className={`grid grid-cols-5 gap-3 sm:grid-cols-6 ${className}`.trim()}>
      {Array.from({ length: totalSlots }, (_, idx) => {
        const slot = idx + 1;
        const isFilled = slot <= currentPoints;
        const rewardText = rewardMap[slot];
        const doodleSrc = isFilled ? slotDoodles[slot] : undefined;

        return (
          <div
            key={slot}
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border text-xs font-semibold ${
              rewardText
                ? "border-[#f6a6b2] bg-[#fff0f3] shadow-[0_0_12px_rgba(242,124,145,0.4)]"
                : "border-slate-100 bg-white"
            }`}
          >
            {doodleSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doodleSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className={`h-6 w-6 rounded-full border-2 ${
                  isFilled
                    ? "border-[#f27c91] bg-[#f27c91]"
                    : "border-slate-200"
                }`}
              />
            )}
            {rewardText && (
              <span className="absolute -top-2 right-1 text-lg">🎁</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
