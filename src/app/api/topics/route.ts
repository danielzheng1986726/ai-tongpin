import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { createdAt: "asc" },
    });

    const result = [];

    for (const topic of topics) {
      const posts = await prisma.topicPost.findMany({
        where: { topicId: topic.id },
        orderBy: { floor: "asc" },
      });

      // Batch fetch users for this topic's posts
      const userIds = [...new Set(posts.map((p) => p.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, avatarUrl: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      result.push({
        id: topic.id,
        title: topic.title,
        posts: posts.map((p) => ({
          id: p.id,
          floor: p.floor,
          content: p.content,
          personalityType: p.personalityType,
          likes: p.likes,
          user: userMap.get(p.userId) || { id: p.userId, name: null, avatarUrl: null },
        })),
      });
    }

    return NextResponse.json({ topics: result });
  } catch (e) {
    console.error("GET /api/topics error:", e);
    return NextResponse.json({ topics: [] });
  }
}
