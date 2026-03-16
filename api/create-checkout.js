import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  spark:   process.env.STRIPE_PRICE_SPARK,
  insight: process.env.STRIPE_PRICE_INSIGHT,
  oracle:  process.env.STRIPE_PRICE_ORACLE,
};

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { package: pkg, client, user_email } = req.body || {};

    if (!pkg)             return res.status(400).json({ error: "Missing package" });
    if (!PRICE_IDS[pkg])  return res.status(400).json({ error: `Unknown package: ${pkg}` });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe not configured" });

    const baseUrl = process.env.NEXT_PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_IDS[pkg], quantity: 1 }],
      metadata: {
        client:     client     || "",
        package:    pkg,
        user_email: user_email || "",
      },
      customer_email: user_email || undefined,
      success_url: `${baseUrl}/payment-success.html`,
      cancel_url:  `${baseUrl}?billing=cancelled`,
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("create-checkout error:", err);
    return res.status(500).json({ error: err.message || "Checkout failed" });
  }
}
