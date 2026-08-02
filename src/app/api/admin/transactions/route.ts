export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { MockDB } from '@/lib/mock-db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id') || undefined;

  const transactions = MockDB.getTransactions(userId);
  return NextResponse.json({ success: true, transactions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, type, amount, coin, status, created_at } = body;

    const newTx = {
      id: Math.random().toString(36).substring(2, 15),
      user_id,
      type,
      amount,
      coin,
      status,
      created_at: created_at || new Date().toISOString()
    };

    const savedTx = MockDB.saveTransaction(newTx);
    return NextResponse.json({ success: true, transaction: savedTx });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, tx_id, transaction_id, type, amount, coin, status, created_at } = body;
    const targetId = tx_id || transaction_id || id;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }

    const existingTxs = MockDB.getTransactions();
    const existingTx = existingTxs.find(t => t.id === targetId);

    const updatedTx: any = {};
    if (type !== undefined) updatedTx.type = type;
    if (amount !== undefined) updatedTx.amount = amount;
    if (coin !== undefined) updatedTx.coin = coin;
    if (status !== undefined) updatedTx.status = status;
    if (created_at !== undefined) updatedTx.created_at = created_at;

    const result = MockDB.updateTransaction(targetId, updatedTx);

    if (result) {
      // If a pending withdrawal was rejected, refund the funds back to user
      if (status === 'rejected' && (result.type === 'withdrawal' || type === 'withdrawal')) {
        const refundCoin = result.coin || coin || 'BTC';
        const refundAmt = result.amount || amount || 0;
        if (result.user_id && refundAmt > 0) {
          MockDB.updateWalletBalance(result.user_id, refundCoin, refundAmt);
        }
      } else if (status === 'completed' && (result.type === 'deposit' || type === 'deposit') && existingTx?.status === 'pending') {
        const depositCoin = result.coin || coin || 'BTC';
        const depositAmt = result.amount || amount || 0;
        if (result.user_id && depositAmt > 0) {
          MockDB.updateWalletBalance(result.user_id, depositCoin, depositAmt);
        }
      }

      return NextResponse.json({ success: true, transaction: result });
    } else {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { tx_id } = body;

    const success = MockDB.deleteTransaction(tx_id);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
