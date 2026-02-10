import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runMatching } from "@/lib/matching";

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { targetUserId } = await request.json();
  if (!targetUserId) {
    return NextResponse.json({ error: "缺少目标用户" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
  }

  // 检查是否已有匹配记录（避免重复匹配）
  const existing = await prisma.match.findFirst({
    where: {
      userAId: me.id,
      userBId: targetUserId,
      status: { in: ["processing", "completed"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json({ matchId: existing.id, status: existing.status });
  }

  // 创建匹配记录
  const match = await prisma.match.create({
    data: {
      userAId: me.id,
      userBId: targetUserId,
      status: "processing",
    },
  });

  // 异步执行匹配（不阻塞响应）
  runMatching(match.id, me.id, targetUserId).catch((err) =>
    console.error("Background matching error:", err)
  );

  return NextResponse.json({ matchId: match.id, status: "processing" });
}
