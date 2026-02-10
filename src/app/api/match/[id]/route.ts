import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, avatarUrl: true, shadesJson: true } },
      userB: { select: { id: true, name: true, avatarUrl: true, shadesJson: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "匹配记录不存在" }, { status: 404 });
  }

  if (match.userAId !== me.id && match.userBId !== me.id) {
    return NextResponse.json({ error: "无权查看" }, { status: 403 });
  }

  return NextResponse.json({
    id: match.id,
    status: match.status,
    score: match.score,
    report: JSON.parse(match.report),
    chatLog: JSON.parse(match.chatLog),
    createdAt: match.createdAt,
    userA: match.userA,
    userB: match.userB,
  });
}
