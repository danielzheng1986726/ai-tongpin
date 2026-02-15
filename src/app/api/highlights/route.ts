import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Save a new AI highlight
export async function POST(req: NextRequest) {
  try {
    const { content, topic, speakerA, speakerB } = await req.json();

    if (!content || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const highlight = await prisma.aIHighlight.create({
      data: {
        content,
        topic,
        speakerA: speakerA || "",
        speakerB: speakerB || "",
      },
    });

    return NextResponse.json({ highlight });
  } catch (error) {
    console.error("Failed to save highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Fetch highlights (supports date filtering)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const where = date
      ? {
          createdAt: {
            gte: new Date(`${date}T00:00:00Z`),
            lt: new Date(`${date}T23:59:59Z`),
          },
        }
      : {};

    const highlights = await prisma.aIHighlight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error("Failed to fetch highlights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
