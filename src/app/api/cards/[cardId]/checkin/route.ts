import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await prisma.habitCard.findFirst({
    where: { id: cardId, user: { email: session.user.email } },
  });

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (card.cycleEndAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Cycle expired" }, { status: 409 });
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
    },
  });

  return NextResponse.json({
    pointsAfter: nextPoints,
    isRewardHit,
    rewardText: rewardText ?? null,
  });
}
