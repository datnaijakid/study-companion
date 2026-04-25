export const dynamic = 'force-dynamic';
import { addSavedAssignment, authenticateRequest, buildUserPayload } from "../../../lib/auth";

export async function POST(request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!user.premium) {
    return new Response(JSON.stringify({ error: "Saved assignment tracking is available for premium members only." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, prompt, result } = await request.json();
  if (!prompt || !title || !result) {
    return new Response(JSON.stringify({ error: "Title, prompt, and result are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updatedUser = await addSavedAssignment(user.id, { title, prompt, result });
  if (!updatedUser) {
    return new Response(JSON.stringify({ error: "Unable to save assignment." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(buildUserPayload(updatedUser)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
