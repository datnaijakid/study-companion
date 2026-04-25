import { clearSessionCookie, logoutSession, parseCookies } from "../../../../lib/auth";

export async function POST(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  await logoutSession(cookies.sessionToken);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
