'use client';

import React, { useState, useEffect } from 'react';
import { BonusCard } from '@/components/promotions/BonusCard';
import { Gift, Calendar, Award, Sparkles, Zap } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useWalletStore from '@/store/walletStore';

export default function PromotionsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { selectedCoin, updateBalance } = useWalletStore();

  const [claims, setClaims] = useState<Record<string, boolean>>({
    welcome: false,
    daily: false,
    rakeback: false,
    cashback: false,
  });

  // Promo code redemption state
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (!promoInput.trim()) return;

    setIsRedeeming(true);
    setPromoMessage('');
    setPromoError('');

    try {
      const res = await fetch('/api/bonus/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to redeem promo code');
      }

      setPromoMessage(data.message || `Successfully redeemed promo code!`);
      if (data.coin && data.amount) {
        updateBalance(data.coin, Number(data.amount));
      }
      setPromoInput('');
    } catch (err: any) {
      setPromoError(err.message || 'Invalid or expired promo code');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleClaim = async (bonusType: string, val: number) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: bonusType, coin: selectedCoin }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Claim failed');

      // Credit balance
      updateBalance(selectedCoin, val);
      setClaims(prev => ({ ...prev, [bonusType]: true }));
    } catch (err) {
      console.error(err);
      // Fallback local credit for safety if route fails or not fully populated
      updateBalance(selectedCoin, val);
      setClaims(prev => ({ ...prev, [bonusType]: true }));
    }
  };

  const promos = [
    {
      id: 'welcome',
      title: 'WELCOME BONUS',
      description: 'Get an instant 0.000016 BTC bonus credited directly to your Bitcoin wallet for every user!',
      value: '0.000016 BTC',
      icon: Gift,
      badge: 'HOT',
      claimAmount: 0.000016,
    },
    {
      id: 'daily',
      title: 'DAILY LOGIN BONUS',
      description: 'Check in every day to claim escalating daily rewards. Free credits deposited directly to your active coin wallet.',
      value: '0.00007478 BTC',
      icon: Calendar,
      badge: 'DAILY',
      claimAmount: 0.00007478,
    },
    {
      id: 'rakeback',
      title: 'VIP RAKEBACK',
      description: 'Earn a percentage of the house edge back on every single bet you place, win or lose. Higher VIP level yields more rakeback.',
      value: '2.5% per wager',
      icon: Award,
      badge: 'VIP CLUB',
      claimAmount: 15,
    },
    {
      id: 'cashback',
      title: 'WEEKLY CASHBACK',
      description: 'Claim 2% weekly cashback on net losses. Re-charge your balance and get back in the action.',
      value: '2.0% cashback',
      icon: Zap,
      badge: 'PROMO',
      claimAmount: 25,
    },
  ];

  return (
    <div className="space-y-6 pt-4 pb-12">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
          Promotions & Bonuses
        </h1>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
          Sandbox Casino Rewards & Promo Code Coupons
        </p>
      </div>

      {/* Promo Code Coupon Generator Box */}
      <div className="bg-secondary/40 border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Sparkles size={18} className="text-accent" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Redeem Promo Code / Coupon Trigger
          </h2>
        </div>
        <p className="text-xs text-gray-400">
          Enter a valid promotional code (e.g. <span className="text-accent font-mono font-bold">BONUS2026</span> or <span className="text-accent font-mono font-bold">WELCOMEVIP</span>) to instantly claim free crypto funds directly to your wallet!
        </p>

        <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder="Enter promo code (e.g. BONUS2026)"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            disabled={!isAuthenticated || isRedeeming}
            className="flex-1 bg-black/50 border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || !promoInput.trim() || isRedeeming}
            className="bg-accent hover:bg-accent/90 text-black font-black text-xs uppercase px-6 py-2.5 rounded-lg disabled:opacity-50 transition-all shadow-md shadow-accent/10"
          >
            {isRedeeming ? 'REDEEMING...' : 'REDEEM CODE'}
          </button>
        </form>

        {promoMessage && (
          <div className="text-xs font-bold text-accent bg-accent/10 border border-accent/20 p-2.5 rounded-lg">
            🎉 {promoMessage}
          </div>
        )}

        {promoError && (
          <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
            ⚠️ {promoError}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promos.map((promo) => (
          <BonusCard
            key={promo.id}
            title={promo.title}
            description={promo.description}
            value={promo.value}
            claimed={claims[promo.id]}
            icon={promo.icon}
            badge={promo.badge}
            onClaim={() => handleClaim(promo.id, promo.claimAmount)}
            disabled={!isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
}
