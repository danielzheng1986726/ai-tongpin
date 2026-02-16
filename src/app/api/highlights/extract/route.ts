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
                  "你的任务：从对话中选出一句最有趣的话，原样返回。规则：只输出那一句话不超过40个字、不要加引号编号解释分析、不要说我选择我认为之类的话、直接输出那句话本身",
              },
              {
                role: "user",
                content: `话题：${topic}\n\n${conversation}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 60,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = (aiData.choices?.[0]?.message?.content?.trim() || "");
          if (raw && raw.length <= 80 && !/我选择|我认为|分析/.test(raw)) {
            content = raw.replace(/^["'"「『]+|["'"」』]+$/g, "");
          }
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
