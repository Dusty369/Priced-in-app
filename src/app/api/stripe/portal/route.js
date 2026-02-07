import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';

export async function POST(request) {
  try {
    const stripe = getStripe();
    const { customerId } = await request.json();
    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: request.headers.get('origin') || '/',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
