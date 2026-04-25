import prisma from "../../../../lib/prisma";
import { upgradeToPremium } from "../../../../lib/auth";
import { getWebhookUserData, getRequiredBillingEnv, verifyLemonSqueezySignature } from "../../../../lib/billing";

const PREMIUM_EVENTS = new Set(["order_created", "subscription_created", "subscription_resumed"]);

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const { webhookSecret } = getRequiredBillingEnv();

  if (!verifyLemonSqueezySignature(rawBody, signature, webhookSecret)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const { userId, email, orderId, customerId, subscriptionId, eventName } = getWebhookUserData(payload);

  if (!PREMIUM_EVENTS.has(eventName)) {
    return Response.json({ received: true, ignored: true });
  }

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
      ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
      : null;

  if (!user) {
    return Response.json({ received: true, ignored: true });
  }

  await upgradeToPremium(user.id, { orderId, customerId, subscriptionId });

  return Response.json({ received: true });
}
