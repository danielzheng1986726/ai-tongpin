import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { id: { not: me.id } },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      shadesJson: true,
      personalityType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
