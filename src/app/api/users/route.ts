import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const [users, matches] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: me.id } },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        shadesJson: true,
        personalityType: true,
      },
    }),
    prisma.match.findMany({
      where: {
        status: "completed",
        OR: [{ userAId: me.id }, { userBId: me.id }],
      },
      select: {
        userAId: true,
        userBId: true,
        score: true,
      },
    }),
  ]);

  // Build map: other user ID -> best match score
  const matchScoreMap = new Map<string, number>();
  for (const m of matches) {
    const otherId = m.userAId === me.id ? m.userBId : m.userAId;
    const existing = matchScoreMap.get(otherId);
    if (existing === undefined || m.score > existing) {
      matchScoreMap.set(otherId, m.score);
    }
  }

  // Attach scores and sort: matched first (by score desc), then unmatched
  const usersWithScores = users.map((u) => ({
    ...u,
    matchScore: matchScoreMap.get(u.id) ?? null,
  }));

  usersWithScores.sort((a, b) => {
    if (a.matchScore !== null && b.matchScore !== null) {
      return b.matchScore - a.matchScore;
    }
    if (a.matchScore !== null) return -1;
    if (b.matchScore !== null) return 1;
    return 0;
  });

  return NextResponse.json({ users: usersWithScores });
}
