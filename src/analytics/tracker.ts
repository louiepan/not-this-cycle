import type { AnalyticsEvent, AnalyticsEventType } from './events';

let sessionId: string | null = null;
const queue: AnalyticsEvent[] = [];

export function initTracker(sid: string): void {
  sessionId = sid;
}

export function track(
  type: AnalyticsEventType,
  payload: Record<string, unknown> = {}
): void {
  if (!sessionId) return;

  const event: AnalyticsEvent = {
    type,
    timestamp: Date.now(),
    sessionId,
    payload,
  };

  queue.push(event);

  if (queue.length >= 10) {
    flush();
  }
}

export async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Silently drop on failure — analytics should never break gameplay
    queue.unshift(...batch);
  }
}
