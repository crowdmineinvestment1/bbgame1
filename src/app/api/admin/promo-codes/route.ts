export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { MockDB } from '@/lib/mock-db';

export async function GET() {
  try {
    const promoCodes = MockDB.getPromoCodes();
    return NextResponse.json({ success: true, promoCodes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, type, coin, amount, max_claims, expires_at } = body;

    if (!code || !amount) {
      return NextResponse.json({ success: false, error: 'Code and amount are required' }, { status: 400 });
    }

    const promoData = {
      id: 'promo_' + Math.random().toString(36).substring(2, 10),
      code: code.trim().toUpperCase(),
      type: type || 'fixed_crypto',
      coin: coin || 'BTC',
      amount: Number(amount),
      max_claims: max_claims ? Number(max_claims) : 1000,
      claims_count: 0,
      claimed_users: [],
      expires_at: expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    const saved = MockDB.savePromoCode(promoData);
    return NextResponse.json({ success: true, promoCode: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
    }

    const deleted = MockDB.deletePromoCode(code);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
