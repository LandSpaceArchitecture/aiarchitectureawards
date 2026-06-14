import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, projectTitle, email } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("Stripe not configured. Simulating success for development.");
    return res.json({ id: "simulated_session_id", url: null });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Vercel doesn't have req.headers.origin reliably in all cases, so we construct it or use a fallback
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `AI Architecture Awards Entry: ${projectTitle}`,
              description: "Official Entry Submission Fee",
            },
            unit_amount: amount * 100, // Stripe uses pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      success_url: `${origin}/submit?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/submit?canceled=true`,
      metadata: {
        projectTitle,
        email,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe session creation failed:", error);
    res.status(500).json({ error: String(error) });
  }
}
