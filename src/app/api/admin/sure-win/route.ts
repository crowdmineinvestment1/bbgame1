export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { MockDB } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  try {
    const sureWinUsers = MockDB.getSureWinUsers();
    const unluckyUsers = MockDB.getUnluckyUsers();
    return NextResponse.json({
      success: true,
      sureWinUsers,
      unluckyUsers,
      users: sureWinUsers
    });
  } catch (error) {
    console.error('Sure win API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, action } = await request.json();

    if (!username || !action) {
      return NextResponse.json({ error: 'Missing username or action' }, { status: 400 });
    }

    if (action === 'add' || action === 'add_sure_win') {
      MockDB.removeUnluckyUser(username);
      MockDB.addSureWinUser(username);
    } else if (action === 'remove' || action === 'remove_sure_win') {
      MockDB.removeSureWinUser(username);
    } else if (action === 'add_luck_mine' || action === 'add_unlucky') {
      MockDB.removeSureWinUser(username);
      MockDB.addUnluckyUser(username);
    } else if (action === 'remove_luck_mine' || action === 'remove_unlucky') {
      MockDB.removeUnluckyUser(username);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sureWinUsers: MockDB.getSureWinUsers(),
      unluckyUsers: MockDB.getUnluckyUsers()
    });
  } catch (error) {
    console.error('Sure win API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
