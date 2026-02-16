import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  fetchSecondMeUserInfo,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExternalBaseUrl } from "@/lib/url";

export async function GET(request: NextRequest) {
  const baseUrl = getExternalBaseUrl(request);
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", baseUrl));
  }

  try {
    // 1. 用 code 换取 token
    const tokenResult = await exchangeCodeForToken(code);
    if (tokenResult.code !== 0) {
      return NextResponse.redirect(
        new URL("/?error=token_exchange", baseUrl)
      );
    }

    const { accessToken, refreshToken, expiresIn } = tokenResult.data;

    // 2. 获取用户信息
    const userResult = await fetchSecondMeUserInfo(accessToken);
    if (userResult.code !== 0) {
      return NextResponse.redirect(
        new URL("/?error=user_info", baseUrl)
      );
    }

    const userInfo = userResult.data;
    // 用 route 字段作为 SecondMe 用户唯一标识
    const secondmeUserId = userInfo.route || userInfo.email || "unknown";

    // 3. 创建或更新用户
    const user = await prisma.user.upsert({
      where: { secondmeUserId },
      update: {
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
      create: {
        secondmeUserId,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    // 4. 异步拉取 shades 并缓存（不阻塞登录）
    fetch(`${process.env.SECONDME_API_BASE_URL}/api/secondme/user/shades`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.code === 0 && result.data?.shades) {
          prisma.user.update({
            where: { id: user.id },
            data: { shadesJson: JSON.stringify(result.data.shades) },
          });
        }
      })
      .catch(() => {});

    // 5. 设置 session cookie
    await setSessionCookie(user.id);

    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=callback_failed", baseUrl)
    );
  }
}
