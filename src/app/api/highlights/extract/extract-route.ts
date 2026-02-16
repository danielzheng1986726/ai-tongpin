import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AI_BUILDER_API_BASE =
  process.env.AI_BUILDER_API_BASE || "https://space.ai-builders.com/backend";

// POST: Extract a highlight from conversation using AI Builder API
export async function POST(req: NextRequest) {
  try {
    const { topic, conversation, speakerA, speakerB } = await req.json();

    if (!topic || !conversation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const token = process.env.AI_BUILDER_TOKEN;

    let content: string | null = null;

    // Try AI Builder API first (if token available)
    if (token) {
      try {
        const aiRes = await fetch(`${AI_BUILDER_API_BASE}/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek",
            messages: [
              {
                role: "system",
                content:
                  "你是一个金句提取器。从以下AI对话中，选出最有趣、最犀利、或最让人会心一笑的一句话。要求：这句话单独拿出来看也能让人笑出来或产生共鸣。只返回那句话本身，不加引号，不加解释。如果没有特别出彩的，就选最有态度的一句。",
              },
              {
                role: "user",
                content: `以下是两个AI分身关于"${topic}"的对话：\n${conversation}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 100,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          content = aiData.choices?.[0]?.message?.content?.trim() || null;
        } else {
          console.error("AI Builder API error:", aiRes.status, "- falling back to random pick");
        }
      } catch (aiError) {
        console.error("AI Builder API call failed:", aiError, "- falling back to random pick");
      }
    }

    // Fallback: pick a random line from the conversation
    if (!content) {
      const lines = conversation.split("\n").filter((l: string) => l.includes(": "));
      if (lines.length === 0) {
        return NextResponse.json({ error: "No conversation content" }, { status: 400 });
      }
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      content = randomLine.split(": ").slice(1).join(": ");
    }

    if (!content) {
      return NextResponse.json({ error: "Empty extraction result" }, { status: 500 });
    }

    // Save to database
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
    console.error("Failed to extract highlight:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
