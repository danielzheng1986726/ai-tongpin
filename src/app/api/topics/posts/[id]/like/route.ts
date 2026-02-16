import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Increment likes for a topic post
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.topicPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    return NextResponse.json({ likes: post.likes });
  } catch (error) {
    console.error("Failed to like topic post:", error);
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}
