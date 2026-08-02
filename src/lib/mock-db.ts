import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'src/lib/mock-db-data.json');

interface MockDBData {
  users: any[];
  wallets: any[];
  bonuses: any[];
  transactions: any[];
  bets: any[];
  chat_messages: any[];
  support_messages?: any[];
  deposit_wallets?: Record<string, { address: string; network: string }>;
  sure_win_users?: string[];
  unlucky_users?: string[];
  promo_codes?: any[];
  game_settings?: {
    houseEdge: number;
    maxCrashMultiplier: number;
    minesMaxBombs: number;
    plinkoRiskTier: string;
    diceWinModifier: number;
  };
}

function readDB(): MockDBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData: MockDBData = {
        users: [],
        wallets: [],
        bonuses: [],
        transactions: [],
        bets: [],
        chat_messages: [],
        support_messages: [],
        sure_win_users: [],
        deposit_wallets: {
          BTC: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', network: 'Bitcoin' },
          ETH: { address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', network: 'Ethereum' },
          USDT: { address: 'TXs8v1G95jDq9j89hB89jDq9j89hB89jDq', network: 'Tron (TRC20)' },
          USDC: { address: '0x2775ca415470438cf387f54c2a7e78be6c6bfbf2', network: 'Ethereum (ERC20)' },
          BNB: { address: '0xf3ba2f438cf387f54c2a7e78be6c6bfbf2a7e78be', network: 'BSC (BEP20)' },
          SOL: { address: 'So11111111111111111111111111111111111111112', network: 'Solana' },
          DOGE: { address: 'DK95jDq9j89hB89jDq9j89hB89jDq9j89h', network: 'Dogecoin' },
          TRX: { address: 'TYs8v1G95jDq9j89hB89jDq9j89hB89jDq', network: 'Tron (TRC20)' }
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading mock DB:', error);
    return {
      users: [],
      wallets: [],
      bonuses: [],
      transactions: [],
      bets: [],
      chat_messages: [],
      support_messages: [],
      sure_win_users: []
    };
  }
}

function writeDB(data: MockDBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing mock DB:', error);
  }
}

export const MockDB = {
  // Users
  getUsers: () => readDB().users,
  findUserByEmail: (email: string) => {
    const db = readDB();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  findUserByUsername: (username: string) => {
    const db = readDB();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },
  findUserById: (id: string) => {
    const db = readDB();
    return db.users.find(u => u.id === id) || null;
  },
  saveUser: (user: any) => {
    const db = readDB();
    const existingIdx = db.users.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) {
      db.users[existingIdx] = user;
    } else {
      db.users.push(user);
    }
    writeDB(db);
    return user;
  },

  // Wallets
  getWallets: (userId: string) => {
    const db = readDB();
    return db.wallets.filter(w => w.user_id === userId);
  },
  saveWallets: (wallets: any[]) => {
    const db = readDB();
    wallets.forEach(wallet => {
      const idx = db.wallets.findIndex(w => w.user_id === wallet.user_id && w.coin === wallet.coin);
      if (idx >= 0) {
        db.wallets[idx] = wallet;
      } else {
        db.wallets.push(wallet);
      }
    });
    writeDB(db);
  },
  updateWalletBalance: (userId: string, coin: string, amount: number) => {
    const db = readDB();
    const idx = db.wallets.findIndex(w => w.user_id === userId && w.coin === coin);
    if (idx >= 0) {
      db.wallets[idx].balance = (parseFloat(db.wallets[idx].balance) || 0) + amount;
      writeDB(db);
      return db.wallets[idx];
    }
    const newWallet = {
      id: Math.random().toString(),
      user_id: userId,
      coin,
      balance: amount,
      locked_balance: 0
    };
    db.wallets.push(newWallet);
    writeDB(db);
    return newWallet;
  },

  // Bets
  getBets: (userId?: string) => {
    const db = readDB();
    if (userId) {
      return db.bets.filter(b => b.user_id === userId);
    }
    return db.bets;
  },
  saveBet: (bet: any) => {
    const db = readDB();
    db.bets.push(bet);
    writeDB(db);
    return bet;
  },
  updateBet: (betId: string, updatedBet: any) => {
    const db = readDB();
    const idx = db.bets.findIndex(b => b.id === betId);
    if (idx >= 0) {
      db.bets[idx] = { ...db.bets[idx], ...updatedBet };
      writeDB(db);
      return db.bets[idx];
    }
    return null;
  },

  // Chat messages
  getChatMessages: (limit = 50, room?: string) => {
    const db = readDB();
    if (room) {
      const filtered = db.chat_messages.filter(m => m.room === room || (!m.room && room === 'english'));
      if (filtered.length > 0) return filtered.slice(-limit);
    }
    return db.chat_messages.slice(-limit);
  },
  saveChatMessage: (msg: any) => {
    const db = readDB();
    db.chat_messages.push(msg);
    writeDB(db);
    return msg;
  },

  // Transactions
  getTransactions: (userId?: string) => {
    const db = readDB();
    if (userId) {
      return db.transactions.filter(t => t.user_id === userId);
    }
    return db.transactions;
  },
  saveTransaction: (tx: any) => {
    const db = readDB();
    db.transactions.push(tx);
    writeDB(db);
    return tx;
  },
  updateTransaction: (txId: string, updatedTx: any) => {
    const db = readDB();
    const idx = db.transactions.findIndex(t => t.id === txId);
    if (idx >= 0) {
      db.transactions[idx] = { ...db.transactions[idx], ...updatedTx };
      writeDB(db);
      return db.transactions[idx];
    }
    return null;
  },
  deleteTransaction: (txId: string) => {
    const db = readDB();
    const initialLength = db.transactions.length;
    db.transactions = db.transactions.filter(t => t.id !== txId);
    if (db.transactions.length !== initialLength) {
      writeDB(db);
      return true;
    }
    return false;
  },

  // Bonuses
  getBonuses: (userId: string) => {
    const db = readDB();
    return db.bonuses.filter(b => b.user_id === userId);
  },
  saveBonus: (bonus: any) => {
    const db = readDB();
    db.bonuses.push(bonus);
    writeDB(db);
    return bonus;
  },

  // Deposit Wallets Config
  getDepositWallets: () => {
    const db = readDB();
    if (!db.deposit_wallets) {
      db.deposit_wallets = {
        BTC: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', network: 'Bitcoin' },
        ETH: { address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', network: 'Ethereum' },
        USDT: { address: 'TXs8v1G95jDq9j89hB89jDq9j89hB89jDq', network: 'Tron (TRC20)' },
        USDC: { address: '0x2775ca415470438cf387f54c2a7e78be6c6bfbf2', network: 'Ethereum (ERC20)' },
        BNB: { address: '0xf3ba2f438cf387f54c2a7e78be6c6bfbf2a7e78be', network: 'BSC (BEP20)' },
        SOL: { address: 'So11111111111111111111111111111111111111112', network: 'Solana' },
        DOGE: { address: 'DK95jDq9j89hB89jDq9j89hB89jDq9j89h', network: 'Dogecoin' },
        TRX: { address: 'TYs8v1G95jDq9j89hB89jDq9j89hB89jDq', network: 'Tron (TRC20)' }
      };
    }
    return db.deposit_wallets;
  },
  saveDepositWallet: (coin: string, address: string, network: string) => {
    const db = readDB();
    if (!db.deposit_wallets) {
      db.deposit_wallets = {};
    }
    db.deposit_wallets[coin] = { address, network };
    writeDB(db);
    return db.deposit_wallets[coin];
  },

  // Sure Win / Luck Win & Luck Mine (Unlucky Mode)
  getSureWinUsers: () => {
    const db = readDB();
    return db.sure_win_users || [];
  },
  addSureWinUser: (username: string) => {
    const db = readDB();
    if (!db.sure_win_users) db.sure_win_users = [];
    const lower = username.toLowerCase();
    if (!db.sure_win_users.some(u => u.toLowerCase() === lower)) {
      db.sure_win_users.push(username);
      writeDB(db);
    }
  },
  removeSureWinUser: (username: string) => {
    const db = readDB();
    if (!db.sure_win_users) db.sure_win_users = [];
    const lower = username.toLowerCase();
    db.sure_win_users = (db.sure_win_users || []).filter((u: string) => u.toLowerCase() !== lower);
    writeDB(db);
  },
  getUnluckyUsers: () => {
    const db = readDB();
    return db.unlucky_users || [];
  },
  addUnluckyUser: (username: string) => {
    const db = readDB();
    if (!db.unlucky_users) db.unlucky_users = [];
    const lower = username.toLowerCase();
    if (!db.unlucky_users.some((u: string) => u.toLowerCase() === lower)) {
      db.unlucky_users.push(username);
      writeDB(db);
    }
  },
  removeUnluckyUser: (username: string) => {
    const db = readDB();
    if (!db.unlucky_users) db.unlucky_users = [];
    const lower = username.toLowerCase();
    db.unlucky_users = db.unlucky_users.filter((u: string) => u.toLowerCase() !== lower);
    writeDB(db);
  },
  isUnluckyUser: (username?: string) => {
    if (!username) return false;
    const db = readDB();
    const unlucky = db.unlucky_users || [];
    return unlucky.some((u: string) => u.toLowerCase() === username.toLowerCase());
  },
  isSureWinUser: (username?: string) => {
    if (username) {
      const db = readDB();
      const unlucky = db.unlucky_users || [];
      if (unlucky.some((u: string) => u.toLowerCase() === username.toLowerCase())) {
        return false; // Admin explicitly placed user on Luck Mine / Unlucky loss mode
      }
    }
    return true; // EVERY USER ALWAYS WINS BY DEFAULT ACROSS ALL GAMES
  },

  // Support Messages
  getSupportMessages: (userId: string) => {
    const db = readDB();
    const messages = db.support_messages || [];
    const lower = (userId || '').toLowerCase();
    return messages.filter((m: any) => 
      (m.user_id && m.user_id.toLowerCase() === lower) ||
      (m.username && m.username.toLowerCase() === lower)
    ).sort((a: any, b: any) => new Date(a.created_at || a.timestamp || 0).getTime() - new Date(b.created_at || b.timestamp || 0).getTime());
  },
  saveSupportMessage: (msg: any) => {
    const db = readDB();
    if (!db.support_messages) db.support_messages = [];
    db.support_messages.push(msg);
    writeDB(db);
    return msg;
  },
  getAllSupportChats: () => {
    const db = readDB();
    const messages = db.support_messages || [];
    
    const chatsByUser = new Map();
    
    messages.forEach((msg: any) => {
      if (!chatsByUser.has(msg.user_id)) {
        chatsByUser.set(msg.user_id, {
          user_id: msg.user_id,
          username: msg.username,
          messages: [],
          last_message: msg.message,
          last_message_date: msg.created_at
        });
      }
      
      const chat = chatsByUser.get(msg.user_id);
      chat.messages.push(msg);
      
      if (new Date(msg.created_at) > new Date(chat.last_message_date)) {
        chat.last_message = msg.message;
        chat.last_message_date = msg.created_at;
      }
    });
    
    return Array.from(chatsByUser.values()).sort((a: any, b: any) => new Date(b.last_message_date).getTime() - new Date(a.last_message_date).getTime());
  },

  // VIP Level Override
  updateUserVip: (userId: string, vipLevel: number) => {
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      db.users[idx].vip_level = vipLevel;
      writeDB(db);
      return db.users[idx];
    }
    return null;
  },

  // Promo Codes / Coupons
  getPromoCodes: () => {
    const db = readDB();
    return db.promo_codes || [
      {
        id: 'promo_default_1',
        code: 'BONUS2026',
        type: 'fixed_crypto',
        coin: 'BTC',
        amount: 0.0001,
        max_claims: 1000,
        claims_count: 3,
        claimed_users: [],
        expires_at: '2027-12-31T23:59:59.000Z',
        created_at: new Date().toISOString()
      },
      {
        id: 'promo_default_2',
        code: 'WELCOMEVIP',
        type: 'fixed_crypto',
        coin: 'USDT',
        amount: 50,
        max_claims: 500,
        claims_count: 12,
        claimed_users: [],
        expires_at: '2027-12-31T23:59:59.000Z',
        created_at: new Date().toISOString()
      }
    ];
  },
  savePromoCode: (promo: any) => {
    const db = readDB();
    if (!db.promo_codes) db.promo_codes = MockDB.getPromoCodes();
    const idx = db.promo_codes.findIndex(p => p.code.toUpperCase() === promo.code.toUpperCase());
    if (idx >= 0) {
      db.promo_codes[idx] = { ...db.promo_codes[idx], ...promo };
    } else {
      db.promo_codes.push(promo);
    }
    writeDB(db);
    return promo;
  },
  deletePromoCode: (codeStr: string) => {
    const db = readDB();
    if (!db.promo_codes) db.promo_codes = MockDB.getPromoCodes();
    const initialLen = db.promo_codes.length;
    db.promo_codes = db.promo_codes.filter(p => p.code.toUpperCase() !== codeStr.toUpperCase());
    if (db.promo_codes.length !== initialLen) {
      writeDB(db);
      return true;
    }
    return false;
  },
  redeemPromoCode: (userId: string, codeStr: string) => {
    const db = readDB();
    if (!db.promo_codes) db.promo_codes = MockDB.getPromoCodes();
    const upperCode = codeStr.trim().toUpperCase();
    const promo = db.promo_codes.find(p => p.code.toUpperCase() === upperCode);

    if (!promo) {
      return { success: false, error: 'Invalid or non-existent promo code.' };
    }

    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'This promo code has expired.' };
    }

    if (promo.max_claims && promo.claims_count >= promo.max_claims) {
      return { success: false, error: 'This promo code has reached its maximum claim limit.' };
    }

    if (!promo.claimed_users) promo.claimed_users = [];
    if (promo.claimed_users.includes(userId)) {
      return { success: false, error: 'You have already redeemed this promo code!' };
    }

    // Award user reward
    promo.claims_count = (promo.claims_count || 0) + 1;
    promo.claimed_users.push(userId);

    const coin = promo.coin || 'BTC';
    const amount = Number(promo.amount) || 0;

    MockDB.updateWalletBalance(userId, coin, amount);
    MockDB.saveTransaction({
      id: 'tx_promo_' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      type: 'deposit',
      coin,
      amount,
      status: 'completed',
      created_at: new Date().toISOString(),
      note: `Redeemed promo code ${upperCode}`
    });

    writeDB(db);
    return { success: true, message: `Successfully redeemed code ${upperCode}! Granted +${amount} ${coin}.`, coin, amount };
  },

  // Game Odds & RTP Settings
  getGameSettings: () => {
    const db = readDB();
    if (!db.game_settings) {
      db.game_settings = {
        houseEdge: 1.0,
        maxCrashMultiplier: 100.0,
        minesMaxBombs: 24,
        plinkoRiskTier: 'standard',
        diceWinModifier: 1.0
      };
    }
    return db.game_settings;
  },
  updateGameSettings: (newSettings: any) => {
    const db = readDB();
    db.game_settings = { ...(db.game_settings || MockDB.getGameSettings()), ...newSettings };
    writeDB(db);
    return db.game_settings;
  }
};
