import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'bb-game-secret-key-change-in-production';

const DAILY_REWARDS = [
  0.0001, // Day 1
  0.00015, // Day 2
  0.0002, // Day 3
  0.0003, // Day 4
  0.0005, // Day 5
  0.0007, // Day 6
  0.001, // Day 7
];

function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('bb-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      username: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all bonuses for user
    const { data: bonuses, error } = await (supabase as any)
      .from('bonuses')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Bonus fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch bonuses' }, { status: 500 });
    }

    // Calculate daily bonus info
    const lastDailyClaim = (bonuses as any[])?.find(b => b.type === 'daily' && b.status === 'claimed');
    const now = new Date();
    const lastClaimDate = lastDailyClaim ? new Date(lastDailyClaim.claimed_at) : null;
    const canClaimDaily = !lastClaimDate ||
      (now.getTime() - lastClaimDate.getTime()) > 24 * 60 * 60 * 1000;

    // Calculate current daily streak
    let dailyStreak = 0;
    const dailyClaims = ((bonuses as any[]) || [])
      .filter(b => b.type === 'daily' && b.status === 'claimed')
      .sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime());

    if (dailyClaims.length > 0) {
      dailyStreak = 1;
      for (let i = 1; i < dailyClaims.length; i++) {
        const diff = new Date(dailyClaims[i - 1].claimed_at).getTime() -
          new Date(dailyClaims[i].claimed_at).getTime();
        if (diff <= 48 * 60 * 60 * 1000) {
          dailyStreak++;
        } else break;
      }
    }

    // Calculate rakeback
    const { data: bets } = await (supabase as any)
      .from('bets')
      .select('amount, house_edge')
      .eq('user_id', user.userId);

    const totalRakeGenerated = ((bets as any[]) || []).reduce((sum, bet) => {
      return sum + (parseFloat(bet.amount) * (parseFloat(bet.house_edge) || 0.01));
    }, 0);

    const rakebackRate = 0.05; // 5% base rakeback
    const claimedRakeback = ((bonuses as any[]) || [])
      .filter(b => b.type === 'rakeback' && b.status === 'claimed')
      .reduce((sum, b) => sum + parseFloat(b.amount), 0);

    const availableRakeback = (totalRakeGenerated * rakebackRate) - claimedRakeback;

    // Build available bonuses list
    const availableBonuses = [
      {
        type: 'welcome',
        name: 'Welcome Bonus',
        description: '100% match on first deposit up to 1 BTC',
        status: (bonuses as any[])?.find((b: any) => b.type === 'welcome')?.status || 'available',
        max_amount: 1.0,
        coin: 'BTC',
      },
      {
        type: 'daily',
        name: 'Daily Bonus',
        description: `Day ${(dailyStreak % 7) + 1} reward: ${DAILY_REWARDS[dailyStreak % 7]} BTC`,
        status: canClaimDaily ? 'available' : 'cooldown',
        amount: DAILY_REWARDS[dailyStreak % 7],
        streak: dailyStreak,
        coin: 'BTC',
        next_claim: canClaimDaily ? null :
          new Date((lastClaimDate?.getTime() || 0) + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        type: 'rakeback',
        name: 'Rakeback',
        description: `${(rakebackRate * 100).toFixed(0)}% of house edge returned to you`,
        status: availableRakeback > 0.00000001 ? 'available' : 'empty',
        amount: Math.max(0, availableRakeback),
        coin: 'BTC',
      },
    ];

    return NextResponse.json({ bonuses: availableBonuses });
  } catch (error) {
    console.error('Bonus GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !['welcome', 'daily', 'rakeback'].includes(type)) {
      return NextResponse.json({ error: 'Invalid bonus type' }, { status: 400 });
    }

    let bonusAmount = 0;
    const coin = 'BTC';

    if (type === 'welcome') {
      // Check if already claimed
      const { data: existing } = await (supabase as any)
        .from('bonuses')
        .select('*')
        .eq('user_id', user.userId)
        .eq('type', 'welcome')
        .eq('status', 'claimed')
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Welcome bonus already claimed' }, { status: 400 });
      }

      // Get user's first deposit
      const { data: deposits } = await (supabase as any)
        .from('transactions')
        .select('amount')
        .eq('user_id', user.userId)
        .eq('type', 'deposit')
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
        .limit(1);

      if (!deposits || deposits.length === 0) {
        return NextResponse.json(
          { error: 'Make your first deposit to claim the welcome bonus' },
          { status: 400 }
        );
      }

      bonusAmount = Math.min(parseFloat((deposits as any[])[0].amount), 1.0); // 100% match up to 1 BTC

    } else if (type === 'daily') {
      // Check cooldown
      const { data: lastClaim } = await (supabase as any)
        .from('bonuses')
        .select('*')
        .eq('user_id', user.userId)
        .eq('type', 'daily')
        .eq('status', 'claimed')
        .order('claimed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastClaim) {
        const timeSince = Date.now() - new Date(lastClaim.claimed_at).getTime();
        if (timeSince < 24 * 60 * 60 * 1000) {
          const nextClaim = new Date(new Date(lastClaim.claimed_at).getTime() + 24 * 60 * 60 * 1000);
          return NextResponse.json({
            error: 'Daily bonus on cooldown',
            next_claim: nextClaim.toISOString(),
          }, { status: 400 });
        }
      }

      // Calculate streak
      let streak = 0;
      const { data: dailyClaims } = await (supabase as any)
        .from('bonuses')
        .select('*')
        .eq('user_id', user.userId)
        .eq('type', 'daily')
        .eq('status', 'claimed')
        .order('claimed_at', { ascending: false });

      if (dailyClaims && (dailyClaims as any[]).length > 0) {
        streak = 1;
        for (let i = 1; i < (dailyClaims as any[]).length; i++) {
          const diff = new Date((dailyClaims as any[])[i - 1].claimed_at).getTime() -
            new Date((dailyClaims as any[])[i].claimed_at).getTime();
          if (diff <= 48 * 60 * 60 * 1000) {
            streak++;
          } else break;
        }
      }

      bonusAmount = DAILY_REWARDS[streak % 7];

    } else if (type === 'rakeback') {
      // Calculate available rakeback
      const { data: bets } = await (supabase as any)
        .from('bets')
        .select('amount, house_edge')
        .eq('user_id', user.userId);

      const totalRake = ((bets as any[]) || []).reduce((sum, bet) =>
        sum + (parseFloat(bet.amount) * (parseFloat(bet.house_edge) || 0.01)), 0);

      const { data: claimedBonuses } = await (supabase as any)
        .from('bonuses')
        .select('amount')
        .eq('user_id', user.userId)
        .eq('type', 'rakeback')
        .eq('status', 'claimed');

      const claimed = ((claimedBonuses as any[]) || []).reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const rakebackRate = 0.05;
      bonusAmount = Math.max(0, (totalRake * rakebackRate) - claimed);

      if (bonusAmount < 0.00000001) {
        return NextResponse.json({ error: 'No rakeback available to claim' }, { status: 400 });
      }
    }

    // Credit the bonus to wallet
    const { data: wallet } = await (supabase as any)
      .from('wallets')
      .select('*')
      .eq('user_id', user.userId)
      .eq('coin', coin)
      .single();

    if (wallet) {
      await (supabase as any)
        .from('wallets')
        .update({ balance: (parseFloat(wallet.balance) || 0) + bonusAmount })
        .eq('user_id', user.userId)
        .eq('coin', coin);
    }

    // Record bonus claim
    await (supabase as any).from('bonuses').insert({
      user_id: user.userId,
      type,
      status: 'claimed',
      amount: bonusAmount,
      coin,
      claimed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      bonus: {
        type,
        amount: bonusAmount,
        coin,
      },
      message: `Claimed ${bonusAmount.toFixed(8)} ${coin} ${type} bonus!`,
    });
  } catch (error) {
    console.error('Bonus claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
