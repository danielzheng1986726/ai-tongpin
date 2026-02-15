import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Increment likes for a highlight
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const highlight = await prisma.aIHighlight.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    return NextResponse.json({ likes: highlight.likes });
  } catch (error) {
    console.error("Failed to like highlight:", error);
    return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
  }
}
