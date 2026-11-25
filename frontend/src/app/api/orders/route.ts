import { NextRequest, NextResponse } from 'next/server';
import { createPendingOrder } from '@/services/orderService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const origin = req.nextUrl.origin;

    const result = await createPendingOrder({
      ...body,
      originUrl: origin,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderCode: result.orderCode,
      order: result.order,
      whatsAppUrl: result.whatsAppUrl,
      whatsAppMessage: result.whatsAppMessage,
    });
  } catch (err: unknown) {
    console.error('Order creation API error:', err);
    return NextResponse.json(
      { error: 'Unable to process order at this time. Please try again.' },
      { status: 500 }
    );
  }
}
