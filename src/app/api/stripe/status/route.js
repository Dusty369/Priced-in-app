import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const stripe = getStripe();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ tier: 'free' });
    }

    // Find customer by device_id metadata
    const customers = await stripe.customers.search({
      query: `metadata["device_id"]:"${deviceId}"`,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ tier: 'free' });
    }

    const customer = customers.data[0];

    // Check for active subscriptions (including cancel-at-period-end)
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subs.data.length === 0) {
      return NextResponse.json({ tier: 'free', customerId: customer.id });
    }

    const sub = subs.data[0];
    return NextResponse.json({
      tier: 'professional',
      status: sub.status,
      customerId: customer.id,
      subscription: {
        id: sub.id,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ tier: 'free' });
  }
}
