import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { packDoodleForDb, unpackDoodleFromDb } from "@/lib/doodle-storage";
import { checkinSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const body = await request.json();
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid doodle payload" }, { status: 400 });
  }

  let doodlePayload: Buffer;
  try {
    doodlePayload = packDoodleForDb(parsed.data.doodleImage);
  } catch {
    return NextResponse.json({ error: "Invalid doodle payload" }, { status: 400 });
  }

  const card = await prisma.habitCard.findUnique({
    where: { id: cardId },
  });

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (card.currentPoints >= card.totalSlots) {
    return NextResponse.json({ error: "Card complete" }, { status: 409 });
  }

  const nextPoints = card.currentPoints + 1;
  const rewardMap = (card.rewardMap ?? {}) as Record<string, string>;
  const rewardText = rewardMap[String(nextPoints)];
  const isRewardHit = Boolean(rewardText);

  const updated = await prisma.habitCard.update({
    where: { id: card.id },
    data: {
      currentPoints: nextPoints,
    },
  });

  await prisma.checkinEvent.create({
    data: {
      userId: updated.userId,
      cardId: updated.id,
      pointsAfter: nextPoints,
      isRewardHit,
      doodlePayload: doodlePayload as Prisma.Bytes,
    },
  });

  const slotDoodle = unpackDoodleFromDb(doodlePayload);

  return NextResponse.json({
    pointsAfter: nextPoints,
    isRewardHit,
    rewardText: rewardText ?? null,
    slotDoodle,
  });
}
