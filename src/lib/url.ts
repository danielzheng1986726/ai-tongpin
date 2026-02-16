/**
 * Get the external base URL for redirects.
 * Priority: x-forwarded-host header > SECONDME_REDIRECT_URI origin > request.url
 */
export function getExternalBaseUrl(request: Request): string {
  const fwdHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("x-forwarded-for");
  if (fwdHost) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${fwdHost.split(",")[0].trim()}`;
  }

  const redirectUri = process.env.SECONDME_REDIRECT_URI;
  if (redirectUri) {
    try {
      const u = new URL(redirectUri);
      return u.origin;
    } catch {}
  }

  return new URL(request.url).origin;
}
