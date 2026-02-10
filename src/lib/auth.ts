import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "session_user_id";

/** 构造 SecondMe OAuth 授权 URL */
export function buildAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.SECONDME_CLIENT_ID!,
    redirect_uri: process.env.SECONDME_REDIRECT_URI!,
    response_type: "code",
    scope: "user.info user.info.shades",
  });
  return `${process.env.SECONDME_OAUTH_URL}?${params.toString()}`;
}

/** 用授权码换取 token */
export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.SECONDME_CLIENT_ID!,
    client_secret: process.env.SECONDME_CLIENT_SECRET!,
    redirect_uri: process.env.SECONDME_REDIRECT_URI!,
  });

  const res = await fetch(
    `${process.env.SECONDME_API_BASE_URL}/api/oauth/token/code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    code: number;
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
      scope: string[];
    };
  }>;
}

/** 调用 SecondMe API 获取用户信息 */
export async function fetchSecondMeUserInfo(accessToken: string) {
  const res = await fetch(
    `${process.env.SECONDME_API_BASE_URL}/api/secondme/user/info`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Fetch user info failed: ${res.status}`);
  }

  return res.json() as Promise<{
    code: number;
    data: {
      email?: string;
      name?: string;
      avatarUrl?: string;
      route?: string;
      [key: string]: unknown;
    };
  }>;
}

/** 设置登录 cookie */
export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: "/",
  });
}

/** 清除登录 cookie */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** 获取当前登录用户 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

/** 用 refresh token 刷新 access token */
export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SECONDME_CLIENT_ID!,
    client_secret: process.env.SECONDME_CLIENT_SECRET!,
  });

  const res = await fetch(
    `${process.env.SECONDME_API_BASE_URL}/api/oauth/token/code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  return res.json() as Promise<{
    code: number;
    data: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }>;
}

/** 获取有效的 access token（过期自动刷新） */
export async function getValidAccessToken(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // 还有 5 分钟以上，直接用
  if (user.tokenExpiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return user.accessToken;
  }

  // 过期了，刷新
  const result = await refreshAccessToken(user.refreshToken);
  if (result.code !== 0) throw new Error("Token refresh failed");

  const { accessToken, refreshToken: newRefreshToken, expiresIn } = result.data;
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    },
  });

  return accessToken;
}
