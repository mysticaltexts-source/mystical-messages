import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const STRIPE_SECRET_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// One month credit per plan, in cents (negative = credit on Stripe balance)
const PLAN_CREDIT_CENTS: Record<string, number> = {
  trial:    99,   // $0.99
  basic:    199,  // $1.99
  standard: 499,  // $4.99
  premium:  999,  // $9.99
};

// Stripe price IDs → plan names (must match STRIPE_PRICES in App.jsx)
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1Tf7SKJwbJqhqSCz6V76Rv14": "trial",
  "price_1Tm1oSJwbJqhqSCzgnFCXCkE": "basic",
  "price_1Tm1xxJwbJqhqSCzK25to7AK": "basic",
  "price_1Tm20RJwbJqhqSCzbhq2Mex2": "standard",
  "price_1Tm235JwbJqhqSCzZH8v5Eu6": "standard",
  "price_1Tm29PJwbJqhqSCz2drtO9FI": "premium",
  "price_1Tm2BMJwbJqhqSCz9PyI2d8x": "premium",
};

// Verify Stripe webhook signature using HMAC-SHA256
async function verifyStripeSignature(body: string, signature: string): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const expectedSig = v1Part.slice(3);
    const signedPayload = `${timestamp}.${body}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const sigBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload),
    );

    const computedSig = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    if (computedSig.length !== expectedSig.length) return false;
    let diff = 0;
    for (let i = 0; i < computedSig.length; i++) {
      diff |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  const valid = await verifyStripeSignature(body, signature);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      // ── User completed checkout (first subscription or trial payment)
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planName = session.metadata?.plan_name;

        if (!userId || !planName) {
          console.warn("checkout.session.completed missing metadata:", session.id);
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            plan: planName,
            stripe_customer_id: session.customer ?? null,
            stripe_subscription_id: session.subscription ?? null,
          })
          .eq("id", userId);

        if (error) console.error("profiles update error:", error.message);
        else console.log(`Plan set to "${planName}" for user ${userId}`);

        // ── Phase 2: Qualify pending referral ──
        // Returns the row so Phase 3 can use referrer_id without a second query.
        const { data: qualifiedReferral, error: referralError } = await supabase
          .from("referrals")
          .update({ status: "qualified", qualified_at: new Date().toISOString() })
          .eq("referred_id", userId)
          .eq("status", "pending")
          .select("id, referrer_id")
          .maybeSingle();

        if (referralError) {
          console.error("referral qualification error:", referralError.message);
          break;
        }
        if (!qualifiedReferral?.referrer_id) {
          // No pending referral, or unverified row (no referrer_id) — nothing to reward
          break;
        }
        console.log(`Referral qualified for user ${userId}`);

        // ── Phase 3: Reward the referrer ──
        const { data: referrerProfile } = await supabase
          .from("profiles")
          .select("stripe_customer_id, plan")
          .eq("id", qualifiedReferral.referrer_id)
          .maybeSingle();

        if (!referrerProfile?.stripe_customer_id) {
          console.log(`Referrer ${qualifiedReferral.referrer_id} has no Stripe customer — reward deferred`);
          break;
        }

        const creditCents = PLAN_CREDIT_CENTS[referrerProfile.plan] ?? 0;
        if (creditCents === 0) {
          console.log(`Referrer ${qualifiedReferral.referrer_id} on unrecognised plan — no credit issued`);
          break;
        }

        const stripeRes = await fetch(
          `https://api.stripe.com/v1/customers/${referrerProfile.stripe_customer_id}/balance_transactions`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              amount:      String(-creditCents),
              currency:    "usd",
              description: `Referral reward — 1 free month (${referrerProfile.plan} plan)`,
            }),
          }
        );

        if (!stripeRes.ok) {
          const stripeErr = await stripeRes.json();
          console.error("Stripe balance credit error:", JSON.stringify(stripeErr));
          break; // Leave as "qualified" — retry manually via Stripe dashboard
        }

        const { error: rewardError } = await supabase
          .from("referrals")
          .update({ status: "rewarded", rewarded_at: new Date().toISOString() })
          .eq("id", qualifiedReferral.id);

        if (rewardError) console.error("referral reward update error:", rewardError.message);
        else console.log(`Referrer ${qualifiedReferral.referrer_id} rewarded: $${(creditCents / 100).toFixed(2)} credit`);

        break;
      }

      // ── Subscription changed (upgrade / downgrade / renewal)
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];

        if (!plan) {
          console.warn("Unrecognised price ID on subscription.updated:", priceId);
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({ plan, stripe_subscription_id: sub.id })
          .eq("stripe_customer_id", sub.customer);

        if (error) console.error("profiles update error:", error.message);
        else console.log(`Plan updated to "${plan}" for customer ${sub.customer}`);
        break;
      }

      // ── Subscription cancelled / expired
      case "customer.subscription.deleted": {
        const sub = event.data.object;

        const { error } = await supabase
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("stripe_customer_id", sub.customer);

        if (error) console.error("profiles update error:", error.message);
        else console.log(`Plan reset to "free" for customer ${sub.customer}`);
        break;
      }

      // ── Payment failed — log for now, add email alert later
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("Payment failed — customer:", invoice.customer, "invoice:", invoice.id);
        break;
      }

      default:
        // Acknowledge but ignore unhandled event types
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Always return 200 so Stripe doesn't keep retrying on our bugs
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
});
