import { createHmac, timingSafeEqual } from "crypto";

const LEMON_API_URL = "https://api.lemonsqueezy.com/v1/checkouts";

export function getRequiredBillingEnv() {
  return {
    apiKey: process.env.LEMON_SQUEEZY_API_KEY,
    storeId: process.env.LEMON_SQUEEZY_STORE_ID,
    variantId: process.env.LEMON_SQUEEZY_VARIANT_ID,
    webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  };
}

export async function createLemonSqueezyCheckout({ user, redirectUrl }) {
  const { apiKey, storeId, variantId } = getRequiredBillingEnv();

  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy configuration is missing.");
  }

  const response = await fetch(LEMON_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              user_id: user.id,
              user_email: user.email,
            },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lemon Squeezy checkout failed: ${errorText}`);
  }

  const payload = await response.json();
  return payload?.data?.attributes?.url ?? null;
}

export function verifyLemonSqueezySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function getWebhookUserData(payload) {
  const customData = payload?.meta?.custom_data ?? {};
  const attributes = payload?.data?.attributes ?? {};

  return {
    userId: customData.user_id ?? customData.userId ?? null,
    email: customData.user_email ?? attributes.user_email ?? null,
    orderId: attributes.order_id ? String(attributes.order_id) : null,
    customerId: attributes.customer_id ? String(attributes.customer_id) : null,
    subscriptionId: attributes.subscription_id ? String(attributes.subscription_id) : null,
    eventName: payload?.meta?.event_name ?? "",
  };
}
