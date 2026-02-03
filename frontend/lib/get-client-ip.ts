/**
 * Extract client IP address from Next.js request
 * Handles various proxy headers and scenarios
 */
export function getClientIP(request: Request): string {
  // Check common headers set by proxies and load balancers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to a default value if no IP can be determined
  // In production, we might want to handle this differently
  return "unknown";
}
