'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrCreateDeviceId, getTrialDaysRemaining, isTrialActive } from '../lib/deviceId';
import { STRIPE_CUSTOMER_ID_KEY } from '../lib/constants';

export function useSubscription() {
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  const checkStatus = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`/api/stripe/status?deviceId=${deviceId}`);
      const data = await res.json();

      if (data.tier === 'professional') {
        // Paid subscriber - always professional
        setTier('professional');
      } else if (isTrialActive()) {
        // Within 14-day trial window
        setTier('trial');
      } else {
        // Trial expired, no subscription
        setTier('free');
      }

      setTrialDaysLeft(getTrialDaysRemaining());

      if (data.customerId) {
        setCustomerId(data.customerId);
        localStorage.setItem(STRIPE_CUSTOMER_ID_KEY, data.customerId);
      }
      setSubscription(data.subscription || null);
    } catch {
      // On error, still check trial locally
      if (isTrialActive()) {
        setTier('trial');
        setTrialDaysLeft(getTrialDaysRemaining());
      } else {
        setTier('free');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Handle ?subscription=success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      // Stripe needs a moment to process the checkout
      const timer = setTimeout(() => {
        checkStatus();
      }, 2000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      return () => clearTimeout(timer);
    }
  }, [checkStatus]);

  const startCheckout = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Failed to start checkout. Please try again.');
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const cid = customerId || localStorage.getItem(STRIPE_CUSTOMER_ID_KEY);
      if (!cid) {
        alert('No subscription found.');
        return;
      }
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: cid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Portal failed:', err);
      alert('Failed to open billing portal. Please try again.');
    }
  }, [customerId]);

  return {
    tier,
    loading,
    customerId,
    subscription,
    trialDaysLeft,
    startCheckout,
    openPortal,
    refreshStatus: checkStatus,
  };
}
