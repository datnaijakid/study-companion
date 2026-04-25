import { buildSessionCookie, createSession, createUser, getUserByEmail } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "An account with this email already exists." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await createUser({ email, password });
    if (!user) {
      return new Response(JSON.stringify({ error: "Unable to create user." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await createSession(user.id);
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildSessionCookie(session.token),
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(JSON.stringify({ error: "Unable to create your account right now. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
