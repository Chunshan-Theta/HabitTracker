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
    <div
      className={[
        "grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5 sm:gap-2 md:gap-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Array.from({ length: totalSlots }, (_, idx) => {
        const slot = idx + 1;
        const isFilled = slot <= currentPoints;
        const rewardText = rewardMap[slot];
        const doodleSrc = isFilled ? slotDoodles[slot] : undefined;

        return (
          <div
            key={slot}
            className={`relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-xl border text-xs font-semibold sm:rounded-2xl ${
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
                className={`h-4 w-4 rounded-full border-2 sm:h-6 sm:w-6 ${
                  isFilled
                    ? "border-[#f27c91] bg-[#f27c91]"
                    : "border-slate-200"
                }`}
              />
            )}
            {rewardText && (
              <span className="absolute right-0.5 top-0 text-sm leading-none sm:-top-1 sm:right-1 sm:text-lg">
                🎁
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
