import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';

export async function POST(request) {
  try {
    const stripe = getStripe();
    const { deviceId } = await request.json();
    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    // Search for existing customer with this device ID
    const existing = await stripe.customers.search({
      query: `metadata["device_id"]:"${deviceId}"`,
    });

    let customer = existing.data[0];

    // If customer exists, check for active subscription
    if (customer) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });
      if (subs.data.length > 0) {
        return NextResponse.json(
          { error: 'You already have an active subscription' },
          { status: 400 }
        );
      }
    }

    // Build checkout session params
    const params = {
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${request.headers.get('origin')}/?subscription=success`,
      cancel_url: `${request.headers.get('origin')}/?subscription=cancelled`,
      metadata: { device_id: deviceId },
    };

    if (customer) {
      params.customer = customer.id;
    } else {
      params.subscription_data = {
        metadata: { device_id: deviceId },
      };
    }

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
