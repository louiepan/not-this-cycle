import { NextResponse } from 'next/server';
import { createProviderCatalog } from '@/narrative/providerCatalog';
import { getNarrativeService } from '@/narrative/service';
import type { NarrativeTurnRequest } from '@/narrative/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NarrativeTurnRequest;
    const service = getNarrativeService(createProviderCatalog());
    const response = await service.runTurn(body);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
