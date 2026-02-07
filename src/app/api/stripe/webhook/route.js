import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';

export async function POST(request) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const deviceId = session.metadata?.device_id;
      const customerId = session.customer;

      if (deviceId && customerId) {
        // Ensure customer has device_id in metadata
        await stripe.customers.update(customerId, {
          metadata: { device_id: deviceId },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // Status route checks live — just log
      console.log(`Subscription ${event.type}:`, event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
