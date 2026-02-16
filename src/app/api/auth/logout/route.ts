import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { getExternalBaseUrl } from "@/lib/url";

export async function GET(request: Request) {
  await clearSessionCookie();
  const baseUrl = getExternalBaseUrl(request);
  return NextResponse.redirect(new URL("/", baseUrl));
}
