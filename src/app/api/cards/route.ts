import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeHabitCard, serializeHabitCards } from "@/lib/serialize-card";
import { cardSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = await prisma.habitCard.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(await serializeHabitCards(cards));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = cardSchema.safeParse({
    cardName: body.cardName,
    totalSlots: Number(body.totalSlots),
    rewardMap: body.rewardMap ?? {},
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  const cycleEndAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const card = await prisma.habitCard.create({
    data: {
      userId: user.id,
      cardName: parsed.data.cardName,
      totalSlots: parsed.data.totalSlots,
      rewardMap: parsed.data.rewardMap,
      currentPoints: 0,
      cycleStartAt: now,
      cycleEndAt,
      status: "active",
    },
  });

  return NextResponse.json(await serializeHabitCard(card), { status: 201 });
}
