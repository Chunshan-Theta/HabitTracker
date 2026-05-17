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

  const updated = await prisma.habitCard.update({
    where: { id: card.id },
    data: {
      currentPoints: 0,
      rewardMap: {},
    },
  });

  return NextResponse.json(updated);
}
