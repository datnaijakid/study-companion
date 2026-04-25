import { createSession, verifyCredentials } from "../../../../lib/auth";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid email or password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await createSession(user.id);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `sessionToken=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    },
  });
}
