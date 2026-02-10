import { NextResponse } from "next/server";
import { getCurrentUser, getValidAccessToken, fetchSecondMeUserInfo } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const accessToken = await getValidAccessToken(user.id);
    const result = await fetchSecondMeUserInfo(accessToken);

    if (result.code !== 0) {
      return NextResponse.json({ error: "获取用户信息失败" }, { status: 502 });
    }

    return NextResponse.json({ code: 0, data: result.data });
  } catch (error) {
    console.error("Fetch user info error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
