import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Return today's top highlights sorted by likes
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const highlights = await prisma.aIHighlight.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { likes: "desc" },
      take: 5,
    });

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error("Failed to fetch daily highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
