import type { SubscriptionKeyStatus, SubscriptionKeyStartupStatus } from "@shared/types";
import {
  getSubscriptionKey,
  getSubscriptionKeyCache,
  setSubscriptionKeyCache,
} from "./config-service";

const WEBHOOK_URL = import.meta.env.VITE_SUBSCRIPTION_KEY_WEBHOOK_URL as string | undefined;
const WEBHOOK_TOKEN = import.meta.env.VITE_SUBSCRIPTION_KEY_WEBHOOK_TOKEN as string | undefined;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function validateSubscriptionKey(subscriptionKey: string): Promise<SubscriptionKeyStatus> {
  const response = await fetch(WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Token": WEBHOOK_TOKEN!,
    },
    body: JSON.stringify({ subscriptionKey }),
  });

  if (response.status === 400) {
    return { valid: false, message: "No account found or bad request" };
  }

  if (response.ok) {
    const data = await response.json() as { validKey: boolean };
    if (data.validKey) {
      return { valid: true };
    }
    return { valid: false, message: "Your subscription has expired" };
  }

  throw new Error(`Unexpected response: ${response.status}`);
}

export async function checkSubscriptionKeyOnStartup(): Promise<SubscriptionKeyStartupStatus> {
  if (!WEBHOOK_URL || !WEBHOOK_TOKEN) {
    return null; // dev bypass
  }

  const cache = getSubscriptionKeyCache();
  const now = Date.now();

  if (cache && now - cache.checkedAt < CACHE_TTL_MS) {
    return { ...cache, storedKey: cache.subscriptionKey };
  }

  const storedKey = getSubscriptionKey();

  try {
    if (!storedKey) {
      return { valid: false, message: "No subscription key found" };
    }

    const result = await validateSubscriptionKey(storedKey);
    setSubscriptionKeyCache({ ...result, checkedAt: now, subscriptionKey: storedKey });
    return { ...result, storedKey };
  } catch {
    // Network error — apply offline grace period
    if (cache && now - cache.checkedAt < GRACE_PERIOD_MS) {
      return { valid: true, offline: true, storedKey: cache.subscriptionKey };
    }
    return { valid: false, message: "Could not reach the server. Please check your connection.", storedKey: storedKey ?? undefined };
  }
}
