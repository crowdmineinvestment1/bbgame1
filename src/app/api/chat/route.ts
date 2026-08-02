export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { MockDB } from '@/lib/mock-db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-bb-game-2024';

function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('bb-token')?.value ||
    request.cookies.get('auth_token')?.value ||
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

// Default lively chat bot messages list for English Room
const BOT_MESSAGES = [
  { username: 'SatoshiGhost', vip_level: 8, message: 'Just cashed out 5.2x on Crash! LFG 🔥' },
  { username: 'CryptoKing', vip_level: 12, message: 'anyone tried the new 3D Dice? physics look sick' },
  { username: 'PlinkoPro', vip_level: 4, message: 'Plinko pink row is hot today hit 100x twice' },
  { username: 'MinesWeeper', vip_level: 6, message: 'gg to whoever just hit 25x on Mines!' },
  { username: 'LimboMaster', vip_level: 9, message: 'Setting target to 50x target multiplier wished me luck' },
  { username: 'SpinWin', vip_level: 3, message: 'Wheel of fortune landed on 14x nice payout!' },
  { username: 'CryptoNinja', vip_level: 5, message: 'BTC pump + Casino wins = best combo ever' },
  { username: 'LuckyRoller', vip_level: 7, message: 'Rakeback bonus just claimed thanks Bb.GAME!' },
  { username: 'VipDealer', vip_level: 10, message: 'Good luck everyone in the English Room today 🍀' },
  { username: 'AlphaTrader', vip_level: 11, message: 'Withdrawals super instant today loved it' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const room = searchParams.get('room') || 'english';

    let messages = MockDB.getChatMessages(limit, room);

    if (!messages || messages.length === 0) {
      // Seed room-specific initial messages if room is empty
      let initialMsgs: any[] = [];
      if (room === 'auth_vip') {
        initialMsgs = [
          { id: 'msg_auth_1', user_id: 'sys', username: 'Bb.GAME AuthBot', vip_level: 12, room: 'auth_vip', message: '🟢 Official VIP & Authorization Group Channel active. Verified members & agents online.', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'msg_auth_2', user_id: 'agent_1', username: 'CertGuard_Agent', vip_level: 10, room: 'auth_vip', message: 'Instant authorization & KYC tier 2 checks processing continuously.', created_at: new Date(Date.now() - 1800000).toISOString() },
          { id: 'msg_auth_3', user_id: 'bot_wh', username: 'WhaleTrader99', vip_level: 9, room: 'auth_vip', message: 'High roller authorization limits unlocked smoothly today 💎', created_at: new Date(Date.now() - 600000).toISOString() }
        ];
      } else {
        initialMsgs = [
          { id: 'msg_init_1', user_id: 'sys', username: 'Bb.GAME System', vip_level: 12, room: 'english', message: 'Welcome to the Official English Room! 🚀 Have fun and chat responsibly.', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 'msg_init_2', user_id: 'bot1', username: 'SatoshiGhost', vip_level: 8, room: 'english', message: 'Just cashed out 5.2x on Crash! LFG 🔥', created_at: new Date(Date.now() - 1800000).toISOString() },
          { id: 'msg_init_3', user_id: 'bot2', username: 'CryptoKing', vip_level: 12, room: 'english', message: 'Anyone playing the 3D Dice game today?', created_at: new Date(Date.now() - 900000).toISOString() }
        ];
      }
      initialMsgs.forEach(m => MockDB.saveChatMessage(m));
      messages = MockDB.getChatMessages(limit, room);
    }

    return NextResponse.json({
      success: true,
      room,
      messages: messages || []
    });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, username: reqUsername, isBot, room = 'english' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const user = getUserFromToken(request);
    const senderUsername = isBot ? reqUsername : (user?.username || reqUsername || 'Anonymous');
    const senderId = isBot ? `bot_${Date.now()}` : (user?.userId || 'user_' + Date.now());
    const vipLevel = isBot ? Math.floor(Math.random() * 8) + 2 : (user?.role === 'admin' ? 12 : 3);

    const savedMsg = MockDB.saveChatMessage({
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: senderId,
      username: senderUsername,
      message: message.trim(),
      room,
      vip_level: vipLevel,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: savedMsg });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
