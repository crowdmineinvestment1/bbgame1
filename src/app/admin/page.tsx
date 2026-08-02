'use client';
// Bb.GAME Admin Panel Portal

import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, TrendingUp, DollarSign, Activity, Settings, HelpCircle, UserCheck, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  
  // Custom sandbox settings
  const [houseEdge, setHouseEdge] = useState('1.0');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Deposit Wallets configuration state
  const [walletCoin, setWalletCoin] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletNetwork, setWalletNetwork] = useState('Bitcoin');
  const [configuredWallets, setConfiguredWallets] = useState<Record<string, { address: string; network: string }>>({});
  const [walletSuccess, setWalletSuccess] = useState(false);

  // Live user activity logs
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStats, setApiStats] = useState<{ totalUsers: number; totalWager: number; houseProfit: number; activePlayers: number } | null>(null);

  // Sure win & Luck Mine state
  const [sureWinUsers, setSureWinUsers] = useState<string[]>([]);
  const [unluckyUsers, setUnluckyUsers] = useState<string[]>([]);
  const [sureWinInput, setSureWinInput] = useState('');
  const [sureWinSuccess, setSureWinSuccess] = useState('');

  // Game RTP & Crash Multiplier Tweaker state
  const [maxCrashMultiplier, setMaxCrashMultiplier] = useState('100.0');
  const [minesMaxBombs, setMinesMaxBombs] = useState('24');
  const [plinkoRiskTier, setPlinkoRiskTier] = useState('standard');
  const [diceWinModifier, setDiceWinModifier] = useState('1.0');
  const [gameOddsSuccess, setGameOddsSuccess] = useState(false);

  // Promo Code / Coupon Generator state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoType, setPromoType] = useState('fixed_crypto');
  const [promoCoin, setPromoCoin] = useState('BTC');
  const [promoAmount, setPromoAmount] = useState('0.0001');
  const [promoMaxClaims, setPromoMaxClaims] = useState('1000');
  const [promoCodesList, setPromoCodesList] = useState<any[]>([]);
  const [promoNotice, setPromoNotice] = useState('');

  // Withdrawal Approval / Rejection Queue state
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [withdrawalNotice, setWithdrawalNotice] = useState('');

  // Support chat state
  const [supportChats, setSupportChats] = useState<Record<string, { user_id: string; username: string; messages: any[] }>>({});
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportChats, selectedChatUser]);

  useEffect(() => {
    const fetchSupportChats = async () => {
      try {
        const res = await fetch('/api/admin/support');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.chats)) {
            const chatsMap: Record<string, { user_id: string; username: string; messages: any[] }> = {};
            data.chats.forEach((chat: any) => {
              const key = chat.user_id || chat.username;
              chatsMap[key] = {
                user_id: chat.user_id,
                username: chat.username || 'User',
                messages: chat.messages || []
              };
            });
            setSupportChats(chatsMap);
            if (!selectedChatUser && data.chats.length > 0) {
              setSelectedChatUser(data.chats[0].user_id || data.chats[0].username);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching support chats:', err);
      }
    };

    fetchSupportChats();
    const interval = setInterval(fetchSupportChats, 3000);
    return () => clearInterval(interval);
  }, [selectedChatUser]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatUser || !supportReply.trim()) return;

    const currentChat = supportChats[selectedChatUser];
    const targetUserId = currentChat?.user_id || selectedChatUser;
    const targetUsername = currentChat?.username || selectedChatUser;

    const replyText = supportReply;
    setSupportReply('');

    // Optimistic update
    const newMsg = {
      id: Date.now().toString(),
      sender: 'admin',
      text: replyText,
      message: replyText,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      isAdmin: true,
    };

    setSupportChats(prev => ({
      ...prev,
      [selectedChatUser]: {
        ...prev[selectedChatUser],
        messages: [...(prev[selectedChatUser]?.messages || []), newMsg]
      }
    }));

    try {
      await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: targetUserId,
          username: targetUsername,
          text: replyText,
          message: replyText
        })
      });
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/admin/activities');
        const data = await res.json();
        if (data.success) {
          setActivities(data.activities);
          if (data.stats) {
            setApiStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Error fetching admin live activities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchWallets = async () => {
      try {
        const res = await fetch('/api/admin/deposit-wallets');
        const data = await res.json();
        if (data.success) {
          setConfiguredWallets(data.wallets || {});
        }
      } catch (err) {
        console.error('Error fetching deposit wallets:', err);
      }
    };

    const fetchSureWinUsers = async () => {
      try {
        const res = await fetch('/api/admin/sure-win');
        const data = await res.json();
        if (data.success) {
          setSureWinUsers(data.sureWinUsers || data.users || []);
          setUnluckyUsers(data.unluckyUsers || []);
        }
      } catch (err) {
        console.error('Error fetching sure win users:', err);
      }
    };

    const fetchGameSettings = async () => {
      try {
        const res = await fetch('/api/admin/game-settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setHouseEdge(String(data.settings.houseEdge ?? '1.0'));
          setMaxCrashMultiplier(String(data.settings.maxCrashMultiplier ?? '100.0'));
          setMinesMaxBombs(String(data.settings.minesMaxBombs ?? '24'));
          setPlinkoRiskTier(data.settings.plinkoRiskTier || 'standard');
          setDiceWinModifier(String(data.settings.diceWinModifier ?? '1.0'));
        }
      } catch (err) {
        console.error('Error fetching game settings:', err);
      }
    };

    const fetchPromoCodes = async () => {
      try {
        const res = await fetch('/api/admin/promo-codes');
        const data = await res.json();
        if (data.success) {
          setPromoCodesList(data.promoCodes || []);
        }
      } catch (err) {
        console.error('Error fetching promo codes:', err);
      }
    };

    const fetchPendingWithdrawals = async () => {
      try {
        const res = await fetch('/api/admin/transactions');
        const data = await res.json();
        if (data.success) {
          const pending = (data.transactions || []).filter((t: any) => t.status === 'pending');
          setPendingWithdrawals(pending);
        }
      } catch (err) {
        console.error('Error fetching pending withdrawals:', err);
      }
    };

    fetchActivities();
    fetchWallets();
    fetchSureWinUsers();
    fetchGameSettings();
    fetchPromoCodes();
    fetchPendingWithdrawals();

    const interval = setInterval(() => {
      fetchActivities();
      fetchPendingWithdrawals();
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSaveGameOdds = async () => {
    try {
      const res = await fetch('/api/admin/game-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseEdge: parseFloat(houseEdge) || 1.0,
          maxCrashMultiplier: parseFloat(maxCrashMultiplier) || 100.0,
          minesMaxBombs: parseInt(minesMaxBombs) || 24,
          plinkoRiskTier,
          diceWinModifier: parseFloat(diceWinModifier) || 1.0
        })
      });
      const data = await res.json();
      if (data.success) {
        setGameOddsSuccess(true);
        setTimeout(() => setGameOddsSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error saving game odds settings:', err);
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || !promoAmount) return;
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim().toUpperCase(),
          type: promoType,
          coin: promoCoin,
          amount: parseFloat(promoAmount),
          max_claims: parseInt(promoMaxClaims)
        })
      });
      const data = await res.json();
      if (data.success) {
        setPromoNotice(`Generated promo code "${promoCodeInput.trim().toUpperCase()}" successfully!`);
        setPromoCodeInput('');
        setTimeout(() => setPromoNotice(''), 3000);

        const res2 = await fetch('/api/admin/promo-codes');
        const data2 = await res2.json();
        if (data2.success) setPromoCodesList(data2.promoCodes || []);
      }
    } catch (err) {
      console.error('Error creating promo code:', err);
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        setPromoCodesList(prev => prev.filter(p => p.code !== code));
      }
    } catch (err) {
      console.error('Error deleting promo code:', err);
    }
  };

  const handleWithdrawalAction = async (txId: string, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'completed' : 'rejected';
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        const actionLabel = action === 'approve' ? 'APPROVED' : 'REJECTED (Refunded to wallet)';
        setWithdrawalNotice(`Withdrawal ${txId} ${actionLabel}! Notification sent.`);
        setTimeout(() => setWithdrawalNotice(''), 3500);

        setPendingWithdrawals(prev => prev.filter(t => t.id !== txId));
      }
    } catch (err) {
      console.error('Error handling withdrawal action:', err);
    }
  };

  const handleSaveWallet = async () => {
    if (!walletAddress || !walletNetwork) return;
    try {
      const res = await fetch('/api/admin/deposit-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin: walletCoin, address: walletAddress, network: walletNetwork }),
      });
      const data = await res.json();
      if (data.success) {
        setWalletSuccess(true);
        setWalletAddress('');
        setTimeout(() => setWalletSuccess(false), 2000);
        // Refresh configuration list
        const res2 = await fetch('/api/admin/deposit-wallets');
        const data2 = await res2.json();
        if (data2.success) {
          setConfiguredWallets(data2.wallets || {});
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSureWinAction = async (username: string, action: 'add_sure_win' | 'remove_sure_win' | 'add_luck_mine' | 'remove_luck_mine') => {
    if (!username) return;
    try {
      const res = await fetch('/api/admin/sure-win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action })
      });
      const data = await res.json();
      if (data.success) {
        let msg = '';
        if (action === 'add_sure_win') msg = `${username} set to guaranteed Luck Win (100% win rate)!`;
        else if (action === 'remove_sure_win') msg = `${username} removed from sure win list!`;
        else if (action === 'add_luck_mine') msg = `${username} PLACED ON LUCK MINE (Loss Mode enabled)!`;
        else if (action === 'remove_luck_mine') msg = `${username} removed from Luck Mine!`;
        setSureWinSuccess(msg);
        setSureWinInput('');
        setTimeout(() => setSureWinSuccess(''), 3000);
        setSureWinUsers(data.sureWinUsers || []);
        setUnluckyUsers(data.unluckyUsers || []);
      }
    } catch (err) {
      console.error('Error with sure win action:', err);
    }
  };

  const stats = [
    { name: 'Total Registered Users', value: apiStats?.totalUsers ?? 0, icon: Users, color: 'text-blue-400' },
    { name: 'Total Wager Volume', value: `$${(apiStats?.totalWager ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}`, icon: DollarSign, color: 'text-yellow-500' },
    { name: 'House Net Profit', value: `${(apiStats?.houseProfit ?? 0) >= 0 ? '+' : ''}$${(apiStats?.houseProfit ?? 0).toFixed(2)}`, icon: TrendingUp, color: 'text-accent' },
    { name: 'Active Players', value: String(apiStats?.activePlayers ?? 0), icon: Activity, color: 'text-purple-400' },
  ];

  const handleSaveSettings = () => {
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'registration': return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'deposit': return 'bg-[#00e701]/10 text-[#00e701] border border-[#00e701]/25';
      case 'withdraw': return 'bg-orange-500/10 text-orange-400 border border-orange-500/25';
      case 'chat': return 'bg-purple-500/10 text-purple-400 border border-purple-500/25';
      case 'bet': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25';
      default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/25';
    }
  };

  return (
    <div className="space-y-6 pt-4 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/60 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
            Admin Panel
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Casino back-office operations
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="secondary" size="sm" className="font-bold text-xs flex items-center gap-1.5 border border-gray-800">
              <Users size={14} /> Manage Users
            </Button>
          </Link>
          <Link href="/admin/transactions">
            <Button variant="secondary" size="sm" className="font-bold text-xs flex items-center gap-1.5 border border-gray-800">
              <DollarSign size={14} /> Review Transactions
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 bg-secondary/40 border border-gray-850 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {stat.name}
                </span>
                <span className={`${stat.color} p-1 bg-primary/40 rounded-md border border-gray-800`}>
                  <Icon size={14} />
                </span>
              </div>
              <span className="text-lg font-black text-white mt-4 block">
                {stat.value}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* House config */}
        <Card className="lg:col-span-2 p-5 bg-secondary/50 border border-gray-800 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-gray-800 pb-3 mb-2 flex items-center gap-1.5">
            <Settings size={14} /> General Configurations
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Default House Edge (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={houseEdge}
                onChange={(e) => setHouseEdge(e.target.value)}
                className="w-full bg-primary border border-gray-850 text-white rounded-lg p-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Maintenance Mode
              </label>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-full text-xs font-black uppercase py-2.5 px-4 rounded-lg border transition-all duration-200
                  ${maintenanceMode 
                    ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                    : 'bg-primary border-gray-850 text-gray-400 hover:text-white'}`}
              >
                {maintenanceMode ? 'ENABLED (OFFLINE)' : 'DISABLED (ONLINE)'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800/80 pt-4 flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase">
              {successMsg ? 'Settings updated successfully!' : ''}
            </span>
            <Button onClick={handleSaveSettings} variant="primary" size="sm" className="font-bold py-2 px-6">
              SAVE CHANGES
            </Button>
          </div>
        </Card>

        {/* Quick system alerts */}
        <Card className="lg:col-span-1 p-5 bg-secondary/50 border border-gray-800 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-gray-800 pb-3 mb-2 flex items-center gap-1.5">
            <HelpCircle size={14} /> Pending Actions
          </h3>

          <div className="space-y-3">
            <Link href="/admin/transactions" className="flex items-center justify-between p-3 bg-primary/30 border border-gray-850 hover:border-gray-700 rounded-xl transition-all">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase">Withdrawals</span>
                <span className="text-[9px] text-gray-500 font-bold mt-0.5">{activities.filter(a => a.type === 'withdrawal' || a.type === 'transaction').length} pending review</span>
              </div>
              <span className="bg-yellow-500 text-black font-black text-[9px] px-2 py-0.5 rounded-full">
                REVIEW
              </span>
            </Link>

            <Link href="/admin/users" className="flex items-center justify-between p-3 bg-primary/30 border border-gray-850 hover:border-gray-700 rounded-xl transition-all">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase">KYC Approvals</span>
                <span className="text-[9px] text-gray-500 font-bold mt-0.5">0 pending verification</span>
              </div>
              <span className="text-gray-500 font-bold text-[9px]">
                NONE
              </span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Withdrawal Approval / Rejection Queue Panel */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={15} className="text-yellow-500" /> Pending Withdrawal Approval / Rejection Queue
          </h3>
          <span className="text-[10px] font-bold text-gray-500 uppercase bg-primary px-2.5 py-1 rounded border border-gray-800">
            {pendingWithdrawals.length} Pending
          </span>
        </div>

        {withdrawalNotice && (
          <div className="p-3 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-lg">
            ✅ {withdrawalNotice}
          </div>
        )}

        {pendingWithdrawals.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">No pending withdrawals requiring approval at this moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase font-bold">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Coin</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-gray-300 font-mono">
                {pendingWithdrawals.map((tx) => (
                  <tr key={tx.id} className="hover:bg-primary/30">
                    <td className="py-2.5 px-3 text-gray-400 font-bold">{tx.id || tx.tx_id}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{tx.user_id || 'User'}</td>
                    <td className="py-2.5 px-3 text-yellow-500 font-bold">{tx.coin}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{tx.amount}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-[11px]">{new Date(tx.created_at || Date.now()).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleWithdrawalAction(tx.id || tx.tx_id, 'approve')}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black border border-green-500/40 text-[10px] font-black uppercase px-3 py-1 rounded transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(tx.id || tx.tx_id, 'reject')}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black border border-red-500/40 text-[10px] font-black uppercase px-3 py-1 rounded transition-all"
                        >
                          Reject & Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Game RTP & Crash Multiplier Tweaker Panel */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={15} className="text-accent" /> Game RTP, Odds & Crash Multiplier Tweaker
          </h3>
          {gameOddsSuccess && (
            <span className="text-[10px] font-bold text-accent uppercase">
              ✨ Odds Updated Live!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Default House Edge (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={houseEdge}
              onChange={(e) => setHouseEdge(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Crash Max Multiplier Cap (x)
            </label>
            <input
              type="number"
              step="1"
              placeholder="100.0"
              value={maxCrashMultiplier}
              onChange={(e) => setMaxCrashMultiplier(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Mines Bomb Frequency Cap
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={minesMaxBombs}
              onChange={(e) => setMinesMaxBombs(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Plinko Volatility Preset
            </label>
            <select
              value={plinkoRiskTier}
              onChange={(e) => setPlinkoRiskTier(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs"
            >
              <option value="standard">Standard (Fair RTP)</option>
              <option value="boosted">Boosted Payouts</option>
              <option value="high_volatility">High Volatility (Big Swings)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={handleSaveGameOdds} variant="primary" size="sm" className="font-bold text-xs py-2 px-6">
            SAVE GAME ODDS TWEAKS
          </Button>
        </div>
      </Card>

      {/* Promo Code / Coupon Generator Panel */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={15} className="text-purple-400" /> Promo Code & Coupon Generator
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
            Generate custom promotional codes (e.g. BONUS2026) that grant free crypto or deposit match bonuses to players.
          </p>
        </div>

        {promoNotice && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-xs rounded-lg">
            🎁 {promoNotice}
          </div>
        )}

        <form onSubmit={handleCreatePromoCode} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Trigger Code
            </label>
            <input
              type="text"
              placeholder="e.g. BONUS2026"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Reward Coin
            </label>
            <select
              value={promoCoin}
              onChange={(e) => setPromoCoin(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs"
            >
              {['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'DOGE'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Reward Amount
            </label>
            <input
              type="number"
              step="0.0001"
              placeholder="0.0001 or 50"
              value={promoAmount}
              onChange={(e) => setPromoAmount(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase block">
              Max Claims
            </label>
            <input
              type="number"
              value={promoMaxClaims}
              onChange={(e) => setPromoMaxClaims(e.target.value)}
              className="w-full bg-primary border border-gray-800 text-white rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase p-2.5 rounded-lg transition-all"
          >
            GENERATE PROMO
          </button>
        </form>

        {/* Active Promo Codes List */}
        <div className="pt-3 border-t border-gray-800/80">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-3">Active Promotional Codes</h4>
          {promoCodesList.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No custom promo codes generated yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {promoCodesList.map((promo) => (
                <div key={promo.code} className="bg-primary/50 border border-gray-800 p-3 rounded-lg flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-black text-accent block">{promo.code}</span>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      +{promo.amount} {promo.coin} ({promo.claims_count || 0}/{promo.max_claims || '∞'} claimed)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePromoCode(promo.code)}
                    className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase p-1.5 bg-red-500/10 border border-red-500/20 rounded"
                    title="Delete Promo Code"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Manage Deposit Wallets Panel */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-gray-800 pb-3 mb-2 flex items-center gap-1.5">
          <Settings size={14} className="text-[#00e701]" /> Manage Deposit Wallets (Add / Edit Wallet)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Select Coin
            </label>
            <select
              value={walletCoin}
              onChange={(e) => setWalletCoin(e.target.value)}
              className="w-full bg-primary border border-gray-850 text-white rounded-lg p-2.5 text-xs focus:outline-none"
            >
              {['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'DOGE', 'TRX', 'LTC', 'XRP'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Wallet Network
            </label>
            <input
              type="text"
              placeholder="e.g. Bitcoin, Tron (TRC20), ERC20"
              value={walletNetwork}
              onChange={(e) => setWalletNetwork(e.target.value)}
              className="w-full bg-primary border border-gray-850 text-white rounded-lg p-2.5 text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Deposit Wallet Address
            </label>
            <input
              type="text"
              placeholder="Enter deposit wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-primary border border-gray-850 text-white rounded-lg p-2.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-accent font-bold uppercase">
            {walletSuccess ? 'Wallet configuration updated!' : ''}
          </span>
          <Button onClick={handleSaveWallet} variant="primary" size="sm" className="font-bold py-2 px-6">
            SAVE DEPOSIT WALLET
          </Button>
        </div>

        {/* Configured Wallets List */}
        <div className="mt-4 pt-4 border-t border-gray-800/80">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Active Configured Deposit Addresses:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(configuredWallets).map(([coin, cfg]: [string, any]) => (
              <div key={coin} className="p-3 bg-primary/30 border border-gray-850 rounded-xl space-y-1 relative">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-accent">{coin}</span>
                  <span className="text-[9px] bg-white/5 text-gray-400 font-bold px-1.5 py-0.5 rounded font-sans">
                    {cfg.network}
                  </span>
                </div>
                <div className="text-[10px] text-gray-300 font-mono truncate select-all" title={cfg.address}>
                  {cfg.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Luck Win & Luck Mine Manager */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-gray-800 pb-3 mb-2 flex items-center gap-1.5">
          <Settings size={14} className="text-[#00e701]" /> Luck Win & Luck Mine (Loss Mode) Manager
        </h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          NOTE: By default, EVERY user always wins 100% of their games. To force a user to experience losses, place them on <span className="text-red-400 font-extrabold">LUCK MINE</span> below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Target Username
            </label>
            <input
              type="text"
              placeholder="Enter username to manage..."
              value={sureWinInput}
              onChange={(e) => setSureWinInput(e.target.value)}
              className="w-full bg-primary border border-gray-850 text-white rounded-lg p-2.5 text-xs focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleSureWinAction(sureWinInput, 'add_sure_win')} 
              variant="primary" 
              size="sm" 
              className="font-bold py-2.5 px-4 bg-[#00e701] hover:bg-[#00c701] text-black text-xs"
            >
              ADD TO LUCK WIN
            </Button>
            <Button 
              onClick={() => handleSureWinAction(sureWinInput, 'add_luck_mine')} 
              variant="danger" 
              size="sm" 
              className="font-bold py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              PLACE ON LUCK MINE (LOSS MODE)
            </Button>
          </div>
        </div>

        {sureWinSuccess && (
          <div className="text-[11px] text-accent font-black uppercase pt-1 bg-black/40 p-2.5 rounded-lg border border-accent/20">
            {sureWinSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-800/80">
          {/* Sure Win Users */}
          <div>
            <h4 className="text-[10px] font-bold text-[#00e701] uppercase tracking-widest mb-3">
              🟢 Guaranteed Luck Win Users (100% Win Rate):
            </h4>
            {sureWinUsers.length === 0 ? (
              <p className="text-xs text-gray-500 font-bold bg-primary/20 p-3 rounded-xl">All users win by default unless on Luck Mine.</p>
            ) : (
              <div className="space-y-2">
                {sureWinUsers.map((username) => (
                  <div key={username} className="p-2.5 bg-primary/30 border border-gray-850 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{username}</span>
                    <Button 
                      onClick={() => handleSureWinAction(username, 'remove_sure_win')} 
                      variant="secondary" 
                      size="sm" 
                      className="font-bold py-1 px-3 text-[10px]"
                    >
                      REMOVE
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Luck Mine Users (Loss Mode) */}
          <div>
            <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">
              🔴 Luck Mine Users (Loss Mode Enabled - Forced Losses):
            </h4>
            {unluckyUsers.length === 0 ? (
              <p className="text-xs text-gray-500 font-bold bg-primary/20 p-3 rounded-xl">No users currently on Luck Mine (Nobody is losing!).</p>
            ) : (
              <div className="space-y-2">
                {unluckyUsers.map((username) => (
                  <div key={username} className="p-2.5 bg-red-950/20 border border-red-800/40 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-bold text-red-200">{username}</span>
                    <Button 
                      onClick={() => handleSureWinAction(username, 'remove_luck_mine')} 
                      variant="primary" 
                      size="sm" 
                      className="font-bold py-1 px-3 text-[10px] bg-[#00e701] text-black"
                    >
                      REMOVE FROM LUCK MINE
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Customer Service Chat */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={14} className="text-[#00e701]" /> Customer Service Chat
          </h3>
          <span className="flex items-center gap-1 bg-[#00e701]/10 text-[#00e701] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-[#00e701]/25">
            <span className="w-1 h-1 rounded-full bg-[#00e701] animate-pulse" />
            Live Polling
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
          {/* User List */}
          <div className="border border-gray-850 rounded-lg bg-black/30 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-850 sticky top-0 bg-black/80 backdrop-blur-sm">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Chats</span>
            </div>
            {Object.keys(supportChats).length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-[10px] font-bold p-4 text-center">
                No active conversations.
              </div>
            ) : (
              Object.entries(supportChats).map(([key, chatObj]: [string, any]) => {
                const msgs = chatObj.messages || [];
                const lastMsg = msgs[msgs.length - 1];
                const isSelected = selectedChatUser === key;
                const displayName = chatObj.username || key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedChatUser(key)}
                    className={`p-3 border-b border-gray-850/50 text-left transition-colors flex flex-col gap-1 ${
                      isSelected ? 'bg-gray-800/60' : 'hover:bg-gray-850/30'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-white truncate">{displayName}</span>
                      {lastMsg && (
                        <span className="text-[9px] text-gray-500">
                          {new Date(lastMsg.timestamp || lastMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <span className="text-[10px] text-gray-400 truncate w-full">
                        {lastMsg.isAdmin || lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.text || lastMsg.message}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2 border border-gray-850 rounded-lg bg-black/30 flex flex-col overflow-hidden">
            {!selectedChatUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-2">
                <MessageSquare size={32} className="opacity-20" />
                <span className="text-xs font-bold">Select a user to start chatting</span>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-gray-850 bg-gray-900/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    Chatting with <span className="text-[#00e701]">{supportChats[selectedChatUser]?.username || selectedChatUser}</span>
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800">
                  {supportChats[selectedChatUser]?.messages?.map((msg: any, i: number) => {
                    const isAdmin = msg.isAdmin || msg.sender === 'admin';
                    const text = msg.text || msg.message;
                    const dateStr = new Date(msg.timestamp || msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={msg.id || i} className={`flex flex-col max-w-[80%] ${isAdmin ? 'self-end' : 'self-start'}`}>
                        <div className={`px-3 py-2 rounded-2xl text-xs ${
                          isAdmin 
                            ? 'bg-[#00e701]/20 text-[#00e701] border border-[#00e701]/30 rounded-tr-none' 
                            : 'bg-gray-800 text-white rounded-tl-none'
                        }`}>
                          {text}
                        </div>
                        <span className={`text-[9px] text-gray-500 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                          {isAdmin ? 'Agent (You)' : (supportChats[selectedChatUser]?.username || 'User')} • {dateStr}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendReply} className="p-3 border-t border-gray-850 bg-gray-900/50 flex gap-2">
                  <input
                    type="text"
                    value={supportReply}
                    onChange={(e) => setSupportReply(e.target.value)}
                    placeholder={`Reply to ${selectedChatUser}...`}
                    className="flex-1 bg-black/50 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00e701]/50"
                  />
                  <Button 
                    type="submit" 
                    disabled={!supportReply.trim()}
                    className="bg-[#00e701] text-black px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-[#00c701]"
                  >
                    SEND
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Live Back-Office Activity feed */}
      <Card className="p-5 bg-secondary/50 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} className="text-[#00e701]" /> Real-Time Live User Activity monitor
          </h3>
          <span className="flex items-center gap-1 bg-[#00e701]/10 text-[#00e701] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-[#00e701]/25">
            <span className="w-1 h-1 rounded-full bg-[#00e701] animate-pulse" />
            Live Feed polling
          </span>
        </div>

        <div className="h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-800 font-mono text-[11px]">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Initializing back-office feed...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-gray-650 font-bold">No recent activities log recorded. Activities will stream here as players register, place bets, deposit or send messages.</div>
          ) : (
            activities.map(act => (
              <div key={act.id} className="p-2.5 bg-black/35 rounded-lg border border-gray-850 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getActivityBadgeColor(act.type)}`}>
                    {act.type}
                  </span>
                  <div>
                    <span className="font-bold text-white mr-1.5">{act.username}</span>
                    <span className="text-gray-400">{act.detail}</span>
                  </div>
                </div>
                <span className="text-gray-600 text-[10px] whitespace-nowrap">
                  {new Date(act.time).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
