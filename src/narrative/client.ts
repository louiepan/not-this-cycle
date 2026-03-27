import type {
  NarrativeReviewRequest,
  NarrativeReviewResponse,
  NarrativeTurnRequest,
  NarrativeTurnResponse,
} from './types';

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function requestNarrativeTurn(
  payload: NarrativeTurnRequest
): Promise<NarrativeTurnResponse> {
  return postJson('/api/narrative/turn', payload);
}

export function requestNarrativeReview(
  payload: NarrativeReviewRequest
): Promise<NarrativeReviewResponse> {
  return postJson('/api/narrative/review', payload);
}
