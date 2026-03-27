import { listCostEvents } from '@/analytics/narrativeTelemetry';

interface OpenAICostsBucket {
  object: string;
  amount: {
    value: number;
    currency: string;
  };
  start_time?: number;
  end_time?: number;
  line_item?: string | null;
  project_id?: string | null;
}

interface OpenAICostsResponse {
  data: OpenAICostsBucket[];
}

export interface CostReconciliationSummary {
  estimatedTotalUsd: number;
  providerTotalUsd: number;
  deltaUsd: number;
  currency: string;
  bucketCount: number;
  comparedAt: number;
}

export async function fetchOpenAICostBuckets(params?: {
  startTime?: number;
  endTime?: number;
}): Promise<OpenAICostsBucket[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const endpoint =
    process.env.OPENAI_COSTS_API_URL ?? 'https://api.openai.com/v1/organization/costs';
  const url = new URL(endpoint);
  if (params?.startTime) {
    url.searchParams.set('start_time', String(params.startTime));
  }
  if (params?.endTime) {
    url.searchParams.set('end_time', String(params.endTime));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAI costs: ${response.status}`);
  }

  const body = (await response.json()) as OpenAICostsResponse;
  return body.data ?? [];
}

export async function reconcileOpenAICosts(params?: {
  startTime?: number;
  endTime?: number;
}): Promise<CostReconciliationSummary> {
  const localEvents = listCostEvents().filter((event) => {
    if (params?.startTime && event.recordedAt < params.startTime) return false;
    if (params?.endTime && event.recordedAt > params.endTime) return false;
    return event.providerId === 'openai';
  });

  const estimatedTotalUsd = Number(
    localEvents.reduce((sum, event) => sum + event.estimatedCostUsd, 0).toFixed(6)
  );
  const buckets = await fetchOpenAICostBuckets(params);
  const providerTotalUsd = Number(
    buckets.reduce((sum, bucket) => sum + (bucket.amount?.value ?? 0), 0).toFixed(6)
  );

  return {
    estimatedTotalUsd,
    providerTotalUsd,
    deltaUsd: Number((providerTotalUsd - estimatedTotalUsd).toFixed(6)),
    currency: buckets[0]?.amount?.currency ?? 'usd',
    bucketCount: buckets.length,
    comparedAt: Date.now(),
  };
}
