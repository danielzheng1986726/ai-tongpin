import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");

    const where = after ? { createdAt: { gt: new Date(after) } } : {};

    const messages = await prisma.danmaku.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Failed to fetch danmaku:", error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, message, color } = body;

    if (!userId || !username || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const trimmedMessage = message.trim().slice(0, 50);
    if (!trimmedMessage) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const recent = await prisma.danmaku.findFirst({
      where: {
        userId,
        createdAt: { gt: new Date(Date.now() - 3000) },
      },
    });

    if (recent) {
      return NextResponse.json({ error: "Too fast" }, { status: 429 });
    }

    const danmaku = await prisma.danmaku.create({
      data: {
        userId,
        username,
        message: trimmedMessage,
        color: color || "#FFFFFF",
      },
    });

    return NextResponse.json({ danmaku });
  } catch (error) {
    console.error("Failed to send danmaku:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
