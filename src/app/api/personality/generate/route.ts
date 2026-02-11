import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { actWithSecondMe, fetchUserShades } from "@/lib/secondme";
import { prisma } from "@/lib/prisma";
import { classifyPersonality, type PersonalityScores } from "@/lib/personality";
import { formatShades } from "@/lib/matching";

const ACTION_CONTROL = `仅输出合法 JSON 对象，不要输出任何解释文字。
输出结构：
{
  "career": number(0-100),
  "industry": number(0-100),
  "workStyle": number(0-100),
  "values": number(0-100)
}
根据用户的兴趣标签和个人特征，从以下四个维度评估该用户的个人特质分数：
- career（职业方向）：衡量用户对职业发展的明确程度和驱动力，高分代表方向清晰、目标感强
- industry（行业认知）：衡量用户对行业的理解深度和洞察力，高分代表认知深入、视野开阔
- workStyle（工作风格）：衡量用户偏好快节奏创新型(高分)还是稳重深耕型(低分)
- values（价值观）：衡量用户对团队协作、社会价值、人际关系的重视程度，高分代表重视团队和价值观`;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (user.personalityType && user.personalityScores) {
    return NextResponse.json({
      personalityType: user.personalityType,
      scores: JSON.parse(user.personalityScores),
    });
  }

  let shadesJson = user.shadesJson;
  if (!shadesJson) {
    const shades = await fetchUserShades(user.id);
    if (shades.length > 0) {
      shadesJson = JSON.stringify(shades);
      await prisma.user.update({
        where: { id: user.id },
        data: { shadesJson },
      });
    }
  }

  const shadesText = formatShades(shadesJson);

  const actMessage = `## 用户信息
姓名: ${user.name || "未知"}
兴趣标签: ${shadesText}

请根据以上信息评估该用户的个人职场特质。`;

  const actResult = await actWithSecondMe(user.id, actMessage, ACTION_CONTROL);

  let scores: PersonalityScores;
  try {
    const jsonMatch = actResult.match(/\{[\s\S]*\}/);
    scores = JSON.parse(jsonMatch ? jsonMatch[0] : actResult);
  } catch {
    scores = { career: 60, industry: 60, workStyle: 55, values: 60 };
  }

  const personalityType = classifyPersonality(scores);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      personalityType,
      personalityScores: JSON.stringify(scores),
    },
  });

  return NextResponse.json({ personalityType, scores });
}
