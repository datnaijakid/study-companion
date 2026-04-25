export const dynamic = 'force-dynamic';
import { authenticateRequest, buildUserPayload } from "../../../lib/auth";

export async function GET(request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(buildUserPayload(user)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
