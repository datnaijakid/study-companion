export const dynamic = 'force-dynamic';
import { authenticateRequest, buildUserPayload, upgradeToPremium } from "../../../../lib/auth";

export async function POST(request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upgraded = await upgradeToPremium(user.id);
  if (!upgraded) {
    return new Response(JSON.stringify({ error: "Unable to upgrade account." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(buildUserPayload(upgraded)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
