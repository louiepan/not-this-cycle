import { NextResponse } from 'next/server';
import { reconcileOpenAICosts } from '@/narrative/openaiCostReconciler';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const startTime = url.searchParams.get('start_time');
    const endTime = url.searchParams.get('end_time');
    const result = await reconcileOpenAICosts({
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reconcile costs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
