import { prisma } from "@/lib/prisma";
import { unpackDoodleFromDb } from "@/lib/doodle-storage";
import type { SlotDoodleMap } from "@/types";

export async function getSlotDoodlesForCard(
  cardId: string,
  cycleStartAt: Date
): Promise<SlotDoodleMap> {
  const events = await prisma.checkinEvent.findMany({
    where: {
      cardId,
      createdAt: { gte: cycleStartAt },
      doodlePayload: { not: null },
    },
    select: {
      pointsAfter: true,
      doodlePayload: true,
    },
    orderBy: [{ pointsAfter: "asc" }, { createdAt: "desc" }],
  });

  const slotDoodles: SlotDoodleMap = {};
  for (const event of events) {
    if (!event.doodlePayload) continue;
    if (slotDoodles[event.pointsAfter] !== undefined) {
      continue;
    }
    try {
      slotDoodles[event.pointsAfter] = unpackDoodleFromDb(
        Buffer.from(event.doodlePayload as Uint8Array)
      );
    } catch {
      // Skip corrupt payloads so the card grid still renders.
    }
  }

  return slotDoodles;
}
