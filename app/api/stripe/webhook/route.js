export const dynamic = 'force-dynamic';
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-28",
});

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Invalid webhook configuration." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { premium: true },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
