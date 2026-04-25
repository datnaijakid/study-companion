import { authenticateRequest } from "../../../../lib/auth";
import { createLemonSqueezyCheckout } from "../../../../lib/billing";

export async function POST(request) {
  const user = await authenticateRequest(request);
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.premium) {
    return Response.json({ error: "Your account is already premium." }, { status: 400 });
  }

  try {
    const checkoutUrl = await createLemonSqueezyCheckout({
      user,
      redirectUrl: `${request.nextUrl.origin}/payment/success`,
    });

    if (!checkoutUrl) {
      return Response.json({ error: "Unable to create checkout session." }, { status: 500 });
    }

    return Response.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Lemon Squeezy checkout error:", error);
    return Response.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
