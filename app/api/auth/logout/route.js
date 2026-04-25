export const dynamic = 'force-dynamic';
import { logoutSession, parseCookies } from "../../../../lib/auth";

export async function POST(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  logoutSession(cookies.sessionToken);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "sessionToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}
