'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Smile, ShieldCheck, X, ChevronDown, MessageSquare, Lock, Headphones } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { Badge } from '../ui/Badge';
import { timeAgo } from '@/lib/utils';

interface ChatPanelProps {
  open: boolean;
  onClose?: () => void;
}

const CHAT_ROOMS = [
  { id: 'english', name: 'English Room', icon: MessageSquare, badge: 'Main Chat' },
  { id: 'auth_vip', name: 'Auth & VIP Group', icon: Lock, badge: 'Verification & VIP' },
  { id: 'support_verify', name: 'Authorization Help', icon: Headphones, badge: 'Live Support' },
  { id: 'es', name: 'Español Room', icon: MessageSquare, badge: 'Comunidad' },
];

const BOT_USERNAMES = [
  'Jake_Austin_TX', 'SarahMiller88', 'Brad_Stevens', 'Tyler_Vegas', 'Emily_R_FL',
  'Mason_US', 'Hannah_Nevada', 'Derek_NY', 'Chloe_California', 'Brandon_K_USA',
  'Zachary_M', 'Samantha_M', 'Cody_Bennett', 'Jessica_FL', 'Logan_Cross',
  'Rachel_W', 'Ethan_Vegas', 'Megan_B_OH', 'Justin_Dallas', 'Ashley_Apex',
  'Chris_Denver', 'Austin_G', 'Brittany_S', 'Trevor_Miami', 'Lauren_Texas',
  'Kevin_Chicago', 'Amanda_Vegas', 'Ryan_Philly', 'Katelyn_GA', 'Jordan_Seattle',
  'Taylor_US', 'Kyle_CA', 'Morgan_Phoenix', 'Dylan_FL', 'Haley_Houston',
  'Jacob_Vegas', 'Brooke_NC', 'Matthew_OR', 'Victoria_VA', 'Connor_TN',
  'Amber_CO', 'Caleb_AZ', 'Samantha_SC', 'Hunter_LA', 'Savannah_UT',
  'SatoshiGhost', 'CryptoKing', 'PlinkoPro', 'MinesWeeper', 'LimboMaster',
  'CertGuard_Agent', 'VipAuthBot', 'SpinWin', 'CryptoNinja', 'LuckyRoller',
  'VipDealer', 'AlphaTrader', 'BetGod', 'DiceRoller99', 'WhaleTrader'
];

const BOT_ROOM_CONVERSATIONS: Record<string, string[]> = {
  english: [
    'Just hit 8.5x multiplier on Limbo! LFG 🔥',
    'Anyone playing Crash right now? Target 10x!',
    'Plinko pink row hit 100x payout!! 🎯',
    'gg to whoever just cashed out 50x on Mines!',
    'Setting my target to 15x wish me luck guys',
    'Wheel of fortune landed on 14x jackpot!!',
    'BTC pumping + Bb.GAME wins = best weekend ever',
    'Rakeback bonus just claimed, instantly in my wallet 🎁',
    'Good luck everyone in the English Room today 🍀',
    'My BTC withdrawal processed in under 30 seconds!',
    'Mines 6 gems revealed, cashing out safe 💎',
    'Who else is grinding for VIP 10 status this week?',
    'Dice roll over 50 just landed 3 times in a row!',
    'Loving the new fast payout system guys, super smooth.',
    'Shoutout to Bb.GAME support for answering so fast 🎧',
    'Just turned 0.001 BTC into 0.015 BTC on Plinko!',
    'Hey guys greetings from Texas! 🤠',
    'Yo from California! Win big today everyone!',
    'Just cashed out on Crash at 4.2x nice profit!'
  ],
  auth_vip: [
    '🔐 Authorization check passed instantly for 2.5 BTC deposit!',
    'KYC Tier 2 verified in 15 seconds, VIP status active 🌟',
    'Authorization group synced with security server successfully!',
    'High roller limits authorized for Crash & Mines! ⚡',
    '2FA device authorization completed. Welcome to VIP group!',
    'Agent CertGuard approved my fast-track authorization request! Thanks!',
    'Wallet address ownership authorized on chain ⛓️',
    'Jake_Austin_TX verified in VIP Auth room!',
    'Instant verification desk running smooth today.'
  ],
  support_verify: [
    'Agent: Live authorization desk active 24/7.',
    'Need account authorization? Click Customer Support below for instant help!',
    'Authorization token refreshed automatically.',
    'Fast-track authorization queue is 0 minutes right now!',
    'Support agents active for live assistance.'
  ],
  es: [
    '¡Buenas noches a toda la comunidad! 🍀',
    '¡Acabo de ganar un multiplicador 15x en Mines!',
    'Retiro super rápido por Lightning Network, excelente.',
    '¡Buena suerte a todos hoy!'
  ]
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ open, onClose }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [activeRoom, setActiveRoom] = useState<string>('english');
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [onlineCount, setOnlineCount] = useState(148);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomObj = CHAT_ROOMS.find(r => r.id === activeRoom) || CHAT_ROOMS[0];

  const fetchChatMessages = async (roomToFetch = activeRoom) => {
    try {
      const res = await fetch(`/api/chat?room=${roomToFetch}&limit=50`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Poll chat messages every 2 seconds for active room
  useEffect(() => {
    fetchChatMessages(activeRoom);
    const interval = setInterval(() => fetchChatMessages(activeRoom), 2000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  // Bot active chat generator loop
  useEffect(() => {
    const botInterval = setInterval(async () => {
      const convos = BOT_ROOM_CONVERSATIONS[activeRoom] || BOT_ROOM_CONVERSATIONS.english;
      const randomBot = BOT_USERNAMES[Math.floor(Math.random() * BOT_USERNAMES.length)];
      const randomMsg = convos[Math.floor(Math.random() * convos.length)];

      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: randomMsg,
            username: randomBot,
            room: activeRoom,
            isBot: true,
          }),
        });
        fetchChatMessages(activeRoom);
        setOnlineCount(prev => Math.max(80, prev + Math.floor(Math.random() * 5) - 2));
      } catch (err) {
        // ignore bot errors
      }
    }, 3500);

    return () => clearInterval(botInterval);
  }, [activeRoom]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgText = text.trim();
    if (!msgText || !isAuthenticated || !user) return;

    setText('');

    // Optimistic local add
    const tempMsg = {
      id: 'temp_' + Date.now(),
      username: user.username,
      vip_level: user.vip_level || 1,
      message: msgText,
      room: activeRoom,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          username: user.username,
          room: activeRoom,
        }),
      });
      fetchChatMessages(activeRoom);
    } catch (err) {
      console.error('Error sending chat message:', err);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
      />

      {/* Main Drawer Container: Slide over on Mobile, Fixed Sidebar on Desktop */}
      <aside className="fixed top-0 lg:top-16 right-0 z-50 lg:z-35 w-full sm:w-80 h-full lg:h-[calc(100vh-64px)] bg-[#0f1923] border-l border-gray-800 flex flex-col select-none shadow-2xl transition-all duration-300">
        {/* Top Room Selector Header */}
        <div className="p-3.5 border-b border-gray-800/80 bg-[#1a2c38]/80 flex items-center justify-between relative">
          <div className="relative flex-1 mr-2">
            <button
              onClick={() => setRoomDropdownOpen(!roomDropdownOpen)}
              className="w-full flex items-center justify-between bg-[#0f1923] border border-gray-700/80 hover:border-accent/60 px-3 py-1.5 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse shrink-0" />
                <span className="text-xs font-black text-white truncate uppercase tracking-wider">
                  {currentRoomObj.name}
                </span>
              </div>
              <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
            </button>

            {/* Room Dropdown Menu */}
            {roomDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a2c38] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn py-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-800">
                  Select Chat Group / Room
                </div>
                {CHAT_ROOMS.map((room) => {
                  const Icon = room.icon;
                  const isSelected = room.id === activeRoom;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveRoom(room.id);
                        setRoomDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                        isSelected 
                          ? 'bg-accent/15 text-accent font-bold' 
                          : 'text-gray-300 hover:bg-[#0f1923] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isSelected ? 'text-accent' : 'text-gray-400'} />
                        <span className="text-xs font-bold">{room.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-gray-400 font-mono">
                        {room.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400 font-bold bg-[#0f1923] px-2.5 py-1 rounded-lg border border-gray-800">
              <Users size={12} className="text-accent" />
              <span className="text-white text-xs">{onlineCount}</span>
            </div>

            {/* Close button for Mobile / Tablet */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-tertiary transition-colors"
              title="Close Chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Room Header Banner for Special Groups */}
        {activeRoom === 'auth_vip' && (
          <div className="bg-[#1a2c38]/90 border-b border-accent/20 px-3.5 py-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#00e701] shrink-0" />
            <span className="text-[10px] text-gray-300 font-medium leading-tight">
              Official Authorization & VIP Group Conversation Channel
            </span>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-[#0d161f]">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-gray-500 font-semibold mt-10">
              Connecting to {currentRoomObj.name}...
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg.id || idx} className="flex flex-col space-y-1 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge level={msg.vip_level || 1} className="scale-90 transform origin-left" />
                    <span className="text-[11px] font-bold text-white hover:text-accent cursor-pointer transition-colors">
                      {msg.username}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-semibold">
                    {timeAgo(msg.created_at || '')}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-medium leading-relaxed break-words bg-[#1a2c38]/40 p-2.5 rounded-xl border border-gray-800/40 group-hover:border-gray-700/60 transition-colors">
                  {msg.message}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-gray-800 bg-[#0f1923]">
          {isAuthenticated ? (
            <form onSubmit={handleSend} className="flex gap-2">
              <div className="relative flex-1 bg-[#1a2c38] border border-gray-800 focus-within:border-accent/60 rounded-xl overflow-hidden flex items-center pr-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Chat in ${currentRoomObj.name}...`}
                  maxLength={200}
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 py-2.5 px-3 focus:outline-none"
                />
                <button 
                  type="button" 
                  className="text-gray-500 hover:text-white p-1 rounded"
                >
                  <Smile size={15} />
                </button>
              </div>
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-accent hover:bg-accent-hover text-black px-3.5 py-2.5 rounded-xl flex items-center justify-center transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <div className="text-center py-2.5 px-3 text-xs text-gray-400 font-bold bg-[#1a2c38]/40 rounded-xl border border-gray-800">
              Log in to participate in the group chat.
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

