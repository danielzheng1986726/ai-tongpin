import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, personalityType, personalityScores } = await request.json();

    if (!nickname || typeof nickname !== "string" || nickname.trim().length === 0) {
      return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
    }

    if (nickname.trim().length > 20) {
      return NextResponse.json({ error: "昵称不能超过20个字" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        secondmeUserId: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: nickname.trim(),
        personalityType: personalityType || null,
        personalityScores: personalityScores ? JSON.stringify(personalityScores) : null,
        accessToken: "",
        refreshToken: "",
        tokenExpiresAt: new Date(0),
      },
    });

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        personalityType: user.personalityType,
        personalityScores: user.personalityScores ? JSON.parse(user.personalityScores) : null,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
