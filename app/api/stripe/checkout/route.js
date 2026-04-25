export const dynamic = 'force-dynamic';
import Stripe from "stripe";
import { authenticateRequest } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-28",
});

export async function POST(request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.STRIPE_PRICE_ID || !process.env.NEXT_PUBLIC_APP_URL) {
    return new Response(JSON.stringify({ error: "Stripe configuration is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
    metadata: {
      userId: user.id,
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
