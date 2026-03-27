import { NextResponse } from 'next/server';
import { createProviderCatalog } from '@/narrative/providerCatalog';
import { getNarrativeService } from '@/narrative/service';
import type { NarrativeReviewRequest } from '@/narrative/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NarrativeReviewRequest;
    const service = getNarrativeService(createProviderCatalog());
    const response = await service.runReview(body);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
