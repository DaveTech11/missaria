// ============================================================
// walletService.js
// A self-contained cash economy: "wallet" (on-hand cash) and
// "bank" (safe from /rob). Loans, jobs, gambling, shop, market,
// auctions, and leaderboards all live here. Config knobs are
// grouped at the top so numbers are easy to retune.
// ============================================================

const fs = require("fs");
const path = require("path");

const CONFIG = {
    startingWallet: 500,
    startingBankCap: 5000,

    dailyBase: 200,
    dailyStreakBonus: 25,     // extra cash per streak day, capped below
    dailyStreakCap: 20,       // streak days after which bonus stops growing
    dailyResetHours: 48,      // miss this long and the streak breaks

    workCooldownMs: 60 * 60 * 1000,        // 1h
    workMin: 150, workMax: 450,

    crimeCooldownMs: 2 * 60 * 60 * 1000,   // 2h
    crimeSuccessChance: 0.55,
    crimeMin: 300, crimeMax: 900,
    crimeFailMin: 100, crimeFailMax: 300,

    hustleCooldownMs: 15 * 60 * 1000,      // 15m
    hustleMin: 40, hustleMax: 150,

    robCooldownMs: 60 * 60 * 1000,         // 1h
    robSuccessChance: 0.45,
    robMinPercent: 0.08, robMaxPercent: 0.25,
    robFailPenaltyPercent: 0.10,

    loanMaxAmount: 5000,
    loanInterestRate: 0.15,                // 15% flat interest
    loanDueMs: 24 * 60 * 60 * 1000,        // 24h to repay

    paydayCooldownMs: 6 * 60 * 60 * 1000,  // 6h between passive income claims

    xpPerAction: { work: 8, crime: 10, hustle: 4, gamble: 3 }
};

const DATA_FILE = path.join(__dirname, "..", "data", "wallet.json");
const users = new Map();
function load() {
    try {
        if (!fs.existsSync(DATA_FILE)) return { users: {}, auctions: {}, nextAuctionId: 1 };
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        if (!parsed.users) parsed.users = {};
        if (!parsed.auctions) parsed.auctions = {};
        if (!parsed.nextAuctionId) parsed.nextAuctionId = 1;
        return parsed;
    } catch {
        return { users: {}, auctions: {}, nextAuctionId: 1 };
    }
}

let db = load();

function save() {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// ------------------------------------------------------------
// SHOP / BLACKMARKET catalogs
// ------------------------------------------------------------
const SHOP_ITEMS = {
    fishingrod: { name: "🎣 Fishing Rod", price: 300, sellback: 150, type: "tool" },
    pickaxe: { name: "⛏️ Pickaxe", price: 450, sellback: 220, type: "tool" },
    laptop: { name: "💻 Laptop", price: 1200, sellback: 600, type: "tool" },
    car: { name: "🚗 Car", price: 5000, sellback: 2500, type: "asset" },
    house: { name: "🏠 House", price: 20000, sellback: 10000, type: "asset", income: 400 },
    shop: { name: "🏪 Small Shop", price: 12000, sellback: 6000, type: "asset", income: 250 },
    ring: { name: "💍 Diamond Ring", price: 3000, sellback: 1600, type: "collectible" }
};

const BLACKMARKET_ITEMS = {
    fakeid: { name: "🪪 Fake ID", price: 800, sellback: 300, bustChance: 0.15, fine: 400 },
    lockpick: { name: "🗝️ Lockpick Set", price: 600, sellback: 250, bustChance: 0.12, fine: 300 },
    contraband: { name: "📦 Mystery Crate", price: 1500, sellback: 900, bustChance: 0.20, fine: 700 },
    ghostgun: { name: "🔫 Replica Piece", price: 2500, sellback: 1200, bustChance: 0.25, fine: 1200 }
};

// ------------------------------------------------------------
// ACCOUNT HELPERS
// ------------------------------------------------------------
function getAccount(userId) {
    const key = String(userId);
    if (!db.users[key]) {
        db.users[key] = {
            wallet: CONFIG.startingWallet,
            bank: 0,
            bankCap: CONFIG.startingBankCap,
            xp: 0,
            streak: 0,
            lastDaily: 0,
            lastWork: 0,
            lastCrime: 0,
            lastHustle: 0,
            lastRob: 0,
            lastPayday: 0,
            loan: null,
            inventory: {},
            groups: [],
            wins: 0,
            losses: 0,
            transactions: []
        };
        save();
    }
    return db.users[key];
}

function trackGroup(userId, groupId) {
    if (!groupId) return;
    const acc = getAccount(userId);
    const key = String(groupId);
    if (!acc.groups.includes(key)) {
        acc.groups.push(key);
        save();
    }
}
function hijack(attackerId, targetId) {

    const attacker = getUser(attackerId);
    const target = getUser(targetId);

    if (!attacker || !target) {
        return {
            ok: false,
            reason: "User not found."
        };
    }


    if (attackerId === targetId) {
        return {
            ok: false,
            reason: "You cannot hijack yourself."
        };
    }


    const targetNetWorth = target.wallet + target.bank;


    if (targetNetWorth < CONFIG.hijackMinNetWorth) {
        return {
            ok: true,
            hijacked: false,
            targetNetWorth
        };
    }


    // 50% success chance
    if (Math.random() > 0.5) {

        return {
            ok: true,
            hijacked: false,
            targetNetWorth
        };

    }


    const takenWallet = target.wallet;
    const takenBank = target.bank;

    const amount = takenWallet + takenBank;


    // remove target money
    target.wallet = 0;
    target.bank = 0;


    // add attacker money
    attacker.wallet += takenWallet;
    attacker.bank += takenBank;


    saveUser(attacker);
    saveUser(target);


    return {
        ok: true,
        hijacked: true,
        takenWallet,
        takenBank,
        amount,
        targetNetWorth
    };
}
function logTx(acc, type, amount, note) {
    acc.transactions.unshift({ type, amount, note: note || "", ts: Date.now() });
    if (acc.transactions.length > 25) acc.transactions.length = 25;
}

function addXp(acc, action) {
    acc.xp += CONFIG.xpPerAction[action] || 0;
}

function levelFromXp(xp) {
    return Math.floor(Math.sqrt(xp / 20)) + 1;
}

function xpForNextLevel(level) {
    return Math.pow(level, 2) * 20;
}

function fmtTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ------------------------------------------------------------
// BALANCE / WALLET / BANK
// ------------------------------------------------------------
function getBalance(userId) {
    const acc = getAccount(userId);
    return { wallet: acc.wallet, bank: acc.bank, bankCap: acc.bankCap };
}

function deposit(userId, amount) {
    const acc = getAccount(userId);
    if (amount <= 0) return { ok: false, reason: "Amount must be positive." };
    if (acc.wallet < amount) return { ok: false, reason: "You don't have that much in your wallet." };
    if (acc.bank + amount > acc.bankCap) return { ok: false, reason: `That would exceed your bank capacity of $${acc.bankCap.toLocaleString()}.` };
    acc.wallet -= amount;
    acc.bank += amount;
    logTx(acc, "deposit", amount);
    save();
    return { ok: true };
}

function withdraw(userId, amount) {
    const acc = getAccount(userId);
    if (amount <= 0) return { ok: false, reason: "Amount must be positive." };
    if (acc.bank < amount) return { ok: false, reason: "You don't have that much in your bank." };
    acc.bank -= amount;
    acc.wallet += amount;
    logTx(acc, "withdraw", amount);
    save();
    return { ok: true };
}

function give(fromId, toId, amount) {
    if (String(fromId) === String(toId)) return { ok: false, reason: "You can't send money to yourself." };
    if (amount <= 0) return { ok: false, reason: "Amount must be positive." };
    const from = getAccount(fromId);
    const to = getAccount(toId);
    if (from.wallet < amount) return { ok: false, reason: "You don't have that much in your wallet." };
    from.wallet -= amount;
    to.wallet += amount;
    logTx(from, "give_sent", -amount);
    logTx(to, "give_received", amount);
    save();
    return { ok: true };
}

// ------------------------------------------------------------
// DAILY / STREAK
// ------------------------------------------------------------
function claimDaily(userId) {
    const acc = getAccount(userId);
    const now = Date.now();
    const sinceLast = now - acc.lastDaily;

    if (acc.lastDaily && sinceLast < 24 * 60 * 60 * 1000) {
        return { ok: false, reason: `Already claimed. Come back in ${fmtTime(24 * 60 * 60 * 1000 - sinceLast)}.` };
    }

    if (acc.lastDaily && sinceLast > CONFIG.dailyResetHours * 60 * 60 * 1000) {
        acc.streak = 0;
    }
    acc.streak += 1;

    const bonus = Math.min(acc.streak, CONFIG.dailyStreakCap) * CONFIG.dailyStreakBonus;
    const amount = CONFIG.dailyBase + bonus;

    acc.wallet += amount;
    acc.lastDaily = now;
    logTx(acc, "daily", amount, `streak ${acc.streak}`);
    save();
    return { ok: true, amount, streak: acc.streak, bonus };
}

function getStreak(userId) {
    const acc = getAccount(userId);
    const now = Date.now();
    if (acc.lastDaily && now - acc.lastDaily > CONFIG.dailyResetHours * 60 * 60 * 1000) {
        return 0;
    }
    return acc.streak;
}
function getUser(id) {
    id = String(id);

    let user = users[id];

    if (!user) {
        user = {
            id,
            wallet: 0,
            bank: 0,
            networth: 0,
            xp: 0,
            level: 1
        };

        users[id] = user;
    }

    return user;
}
// ------------------------------------------------------------
// WORK / CRIME / HUSTLE / ROB
// ------------------------------------------------------------
function work(userId) {
    const acc = getAccount(userId);
    const now = Date.now();
    if (now - acc.lastWork < CONFIG.workCooldownMs) {
        return { ok: false, reason: `On cooldown — ${fmtTime(CONFIG.workCooldownMs - (now - acc.lastWork))} left.` };
    }
    acc.lastWork = now;
    const amount = Math.floor(Math.random() * (CONFIG.workMax - CONFIG.workMin + 1)) + CONFIG.workMin;
    acc.wallet += amount;
    addXp(acc, "work");
    logTx(acc, "work", amount);
    save();
    return { ok: true, amount };
}

function crime(userId) {
    const acc = getAccount(userId);
    const now = Date.now();
    if (now - acc.lastCrime < CONFIG.crimeCooldownMs) {
        return { ok: false, reason: `On cooldown — ${fmtTime(CONFIG.crimeCooldownMs - (now - acc.lastCrime))} left.` };
    }
    acc.lastCrime = now;
    addXp(acc, "crime");

    const success = Math.random() < CONFIG.crimeSuccessChance;
    if (success) {
        const amount = Math.floor(Math.random() * (CONFIG.crimeMax - CONFIG.crimeMin + 1)) + CONFIG.crimeMin;
        acc.wallet += amount;
        acc.wins += 1;
        logTx(acc, "crime_success", amount);
        save();
        return { ok: true, success: true, amount };
    }

    const penalty = Math.floor(Math.random() * (CONFIG.crimeFailMax - CONFIG.crimeFailMin + 1)) + CONFIG.crimeFailMin;
    const lost = Math.min(acc.wallet, penalty);
    acc.wallet -= lost;
    acc.losses += 1;
    logTx(acc, "crime_fail", -lost);
    save();
    return { ok: true, success: false, lost };
}

function hustle(userId) {
    const acc = getAccount(userId);
    const now = Date.now();
    if (now - acc.lastHustle < CONFIG.hustleCooldownMs) {
        return { ok: false, reason: `On cooldown — ${fmtTime(CONFIG.hustleCooldownMs - (now - acc.lastHustle))} left.` };
    }
    acc.lastHustle = now;
    const amount = Math.floor(Math.random() * (CONFIG.hustleMax - CONFIG.hustleMin + 1)) + CONFIG.hustleMin;
    acc.wallet += amount;
    addXp(acc, "hustle");
    logTx(acc, "hustle", amount);
    save();
    return { ok: true, amount };
}

function rob(fromId, toId) {
    if (String(fromId) === String(toId)) return { ok: false, reason: "You can't rob yourself." };
    const thief = getAccount(fromId);
    const target = getAccount(toId);
    const now = Date.now();

    if (now - thief.lastRob < CONFIG.robCooldownMs) {
        return { ok: false, reason: `On cooldown — ${fmtTime(CONFIG.robCooldownMs - (now - thief.lastRob))} left.` };
    }
    thief.lastRob = now;

    if (target.wallet < 50) {
        return { ok: false, reason: "They don't have enough cash on hand to bother robbing." };
    }

    const success = Math.random() < CONFIG.robSuccessChance;
    if (success) {
        const pct = CONFIG.robMinPercent + Math.random() * (CONFIG.robMaxPercent - CONFIG.robMinPercent);
        const amount = Math.max(1, Math.floor(target.wallet * pct));
        target.wallet -= amount;
        thief.wallet += amount;
        thief.wins += 1;
        logTx(thief, "rob_success", amount);
        logTx(target, "robbed", -amount);
        save();
        return { ok: true, success: true, amount };
    }

    const penalty = Math.max(1, Math.floor(thief.wallet * CONFIG.robFailPenaltyPercent));
    const lost = Math.min(thief.wallet, penalty);
    thief.wallet -= lost;
    thief.losses += 1;
    logTx(thief, "rob_fail", -lost);
    save();
    return { ok: true, success: false, lost };
}

// ------------------------------------------------------------
// LOANS
// ------------------------------------------------------------
function requestLoan(userId, amount) {
    const acc = getAccount(userId);
    if (acc.loan) return { ok: false, reason: "You already have an active loan. Repay it first with /repayloan." };
    if (amount <= 0 || amount > CONFIG.loanMaxAmount) {
        return { ok: false, reason: `Loan amount must be between $1 and $${CONFIG.loanMaxAmount.toLocaleString()}.` };
    }
    const owed = Math.ceil(amount * (1 + CONFIG.loanInterestRate));
    acc.loan = { principal: amount, owed, takenAt: Date.now(), dueAt: Date.now() + CONFIG.loanDueMs };
    acc.wallet += amount;
    logTx(acc, "loan_taken", amount);
    save();
    return { ok: true, amount, owed, dueAt: acc.loan.dueAt };
}

function repayLoan(userId, amount) {
    const acc = getAccount(userId);
    if (!acc.loan) return { ok: false, reason: "You don't have an active loan." };
    if (amount <= 0) return { ok: false, reason: "Amount must be positive." };
    if (acc.wallet < amount) return { ok: false, reason: "You don't have that much cash in your wallet." };

    const pay = Math.min(amount, acc.loan.owed);
    acc.wallet -= pay;
    acc.loan.owed -= pay;
    logTx(acc, "loan_repay", -pay);

    let cleared = false;
    if (acc.loan.owed <= 0) {
        acc.loan = null;
        cleared = true;
    }
    save();
    return { ok: true, paid: pay, cleared, remaining: cleared ? 0 : acc.loan.owed };
}

function myLoan(userId) {
    const acc = getAccount(userId);
    return acc.loan;
}

// ------------------------------------------------------------
// GAMBLING
// ------------------------------------------------------------
function gamble(userId, bet) {
    const acc = getAccount(userId);
    if (bet <= 0) return { ok: false, reason: "Bet must be positive." };
    if (acc.wallet < bet) return { ok: false, reason: "You don't have that much in your wallet." };

    addXp(acc, "gamble");
    const won = Math.random() < 0.47;
    if (won) {
        acc.wallet += bet;
        acc.wins += 1;
        logTx(acc, "gamble_win", bet);
        save();
        return { ok: true, won: true, amount: bet };
    }
    acc.wallet -= bet;
    acc.losses += 1;
    logTx(acc, "gamble_loss", -bet);
    save();
    return { ok: true, won: false, amount: bet };
}

function coinflip(userId, side, bet) {
    const acc = getAccount(userId);
    if (!["h", "t"].includes(side)) return { ok: false, reason: "Choose h (heads) or t (tails)." };
    if (bet <= 0) return { ok: false, reason: "Bet must be positive." };
    if (acc.wallet < bet) return { ok: false, reason: "You don't have that much in your wallet." };

    addXp(acc, "gamble");
    const result = Math.random() < 0.5 ? "h" : "t";
    const won = result === side;
    if (won) {
        acc.wallet += bet;
        acc.wins += 1;
        logTx(acc, "coinflip_win", bet);
    } else {
        acc.wallet -= bet;
        acc.losses += 1;
        logTx(acc, "coinflip_loss", -bet);
    }
    save();
    return { ok: true, won, result, amount: bet };
}

const SLOT_SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "💎", "7️⃣"];
const SLOT_PAYOUTS = { "🍒": 2, "🍋": 3, "🍇": 4, "🔔": 6, "💎": 10, "7️⃣": 20 };

function slots(userId, bet) {
    const acc = getAccount(userId);
    if (bet <= 0) return { ok: false, reason: "Bet must be positive." };
    if (acc.wallet < bet) return { ok: false, reason: "You don't have that much in your wallet." };

    addXp(acc, "gamble");
    const reels = [0, 0, 0].map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
    let amount = -bet;
    let won = false;

    if (reels[0] === reels[1] && reels[1] === reels[2]) {
        won = true;
        amount = bet * SLOT_PAYOUTS[reels[0]] - bet;
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        won = true;
        amount = Math.floor(bet * 0.5);
    }

    acc.wallet += amount;
    if (won) { acc.wins += 1; } else { acc.losses += 1; }
    logTx(acc, won ? "slots_win" : "slots_loss", amount);
    save();
    return { ok: true, reels, won, amount };
}

function cardValue() {
    const v = Math.floor(Math.random() * 13) + 1; // 1-13
    if (v > 10) return 10;
    if (v === 1) return 11;
    return v;
}

function blackjack(userId, bet) {
    const acc = getAccount(userId);
    if (bet <= 0) return { ok: false, reason: "Bet must be positive." };
    if (acc.wallet < bet) return { ok: false, reason: "You don't have that much in your wallet." };

    addXp(acc, "gamble");

    const draw = () => {
        const cards = [cardValue(), cardValue()];
        let total = cards[0] + cards[1];
        while (total < 17) {
            const c = cardValue();
            cards.push(c);
            total += c;
        }
        if (total > 21 && cards.includes(11)) total -= 10; // soften an ace
        return { cards, total };
    };

    const player = draw();
    const dealer = draw();

    let result, amount;
    const playerBust = player.total > 21;
    const dealerBust = dealer.total > 21;

    if (playerBust) { result = "lose"; amount = -bet; }
    else if (dealerBust) { result = "win"; amount = bet; }
    else if (player.total > dealer.total) { result = "win"; amount = bet; }
    else if (player.total < dealer.total) { result = "lose"; amount = -bet; }
    else { result = "push"; amount = 0; }

    acc.wallet += amount;
    if (result === "win") acc.wins += 1;
    else if (result === "lose") acc.losses += 1;
    logTx(acc, "blackjack_" + result, amount);
    save();
    return { ok: true, result, amount, player, dealer };
}

// ------------------------------------------------------------
// SHOP / INVENTORY / SELL / MARKET / BLACKMARKET
// ------------------------------------------------------------
function listShop() { return SHOP_ITEMS; }
function listBlackmarket() { return BLACKMARKET_ITEMS; }

function buyItem(userId, key, qty) {
    qty = Math.max(1, qty || 1);
    const item = SHOP_ITEMS[key];
    if (!item) return { ok: false, reason: "That item doesn't exist in the shop." };
    const acc = getAccount(userId);
    const cost = item.price * qty;
    if (acc.wallet < cost) return { ok: false, reason: "You don't have enough cash for that." };
    acc.wallet -= cost;
    acc.inventory[key] = (acc.inventory[key] || 0) + qty;
    logTx(acc, "buy", -cost, item.name);
    save();
    return { ok: true, item, qty, cost };
}

function sellItem(userId, key, qty) {
    qty = Math.max(1, qty || 1);
    const item = SHOP_ITEMS[key] || BLACKMARKET_ITEMS[key];
    if (!item) return { ok: false, reason: "That item doesn't exist." };
    const acc = getAccount(userId);
    const have = acc.inventory[key] || 0;
    if (have < qty) return { ok: false, reason: "You don't own that many to sell." };
    const value = item.sellback * qty;
    acc.inventory[key] -= qty;
    if (acc.inventory[key] <= 0) delete acc.inventory[key];
    acc.wallet += value;
    logTx(acc, "sell", value, item.name);
    save();
    return { ok: true, item, qty, value };
}

function inventory(userId) {
    const acc = getAccount(userId);
    return Object.entries(acc.inventory).map(([key, qty]) => {
        const item = SHOP_ITEMS[key] || BLACKMARKET_ITEMS[key];
        return { key, qty, item };
    });
}

function buyBlackmarket(userId, key, qty) {
    qty = Math.max(1, qty || 1);
    const item = BLACKMARKET_ITEMS[key];
    if (!item) return { ok: false, reason: "That item isn't sold on the black market." };
    const acc = getAccount(userId);
    const cost = item.price * qty;
    if (acc.wallet < cost) return { ok: false, reason: "You don't have enough cash for that." };

    acc.wallet -= cost;
    logTx(acc, "blackmarket_buy", -cost, item.name);

    const busted = Math.random() < item.bustChance;
    if (busted) {
        const fine = Math.min(acc.wallet, item.fine);
        acc.wallet -= fine;
        logTx(acc, "busted", -fine, item.name);
        save();
        return { ok: true, busted: true, item, qty, cost, fine };
    }

    acc.inventory[key] = (acc.inventory[key] || 0) + qty;
    save();
    return { ok: true, busted: false, item, qty, cost };
}

// ------------------------------------------------------------
// AUCTION HOUSE
// ------------------------------------------------------------
function createAuction(userId, key, qty, minBid, durationMs) {
    qty = Math.max(1, qty || 1);
    const item = SHOP_ITEMS[key] || BLACKMARKET_ITEMS[key];
    if (!item) return { ok: false, reason: "That item doesn't exist." };
    const acc = getAccount(userId);
    const have = acc.inventory[key] || 0;
    if (have < qty) return { ok: false, reason: "You don't own that many to auction." };

    acc.inventory[key] -= qty;
    if (acc.inventory[key] <= 0) delete acc.inventory[key];

    const id = db.nextAuctionId++;
    db.auctions[id] = {
        id, sellerId: String(userId), key, qty,
        minBid, highestBid: 0, highestBidder: null,
        endsAt: Date.now() + (durationMs || 60 * 60 * 1000)
    };
    save();
    return { ok: true, id, item, qty };
}

function bidAuction(userId, id, amount) {
    const auction = db.auctions[id];
    if (!auction) return { ok: false, reason: "Auction not found." };
    if (Date.now() > auction.endsAt) return { ok: false, reason: "This auction has already ended." };
    if (String(userId) === auction.sellerId) return { ok: false, reason: "You can't bid on your own auction." };
    if (amount <= auction.highestBid || amount < auction.minBid) {
        return { ok: false, reason: `Bid must beat $${Math.max(auction.highestBid, auction.minBid - 1).toLocaleString()}.` };
    }
    const acc = getAccount(userId);
    if (acc.wallet < amount) return { ok: false, reason: "You don't have that much in your wallet." };

    // refund the previous highest bidder
    if (auction.highestBidder) {
        const prev = getAccount(auction.highestBidder);
        prev.wallet += auction.highestBid;
    }
    acc.wallet -= amount;
    auction.highestBid = amount;
    auction.highestBidder = String(userId);
    save();
    return { ok: true, auction };
}

function listAuctions() {
    const now = Date.now();
    return Object.values(db.auctions).filter(a => a.endsAt > now);
}

// ------------------------------------------------------------
// LEADERBOARDS
// ------------------------------------------------------------
function leaderboard(limit = 10) {
    return Object.entries(db.users)
        .map(([id, acc]) => ({ id, total: acc.wallet + acc.bank, wallet: acc.wallet, bank: acc.bank }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}

function groupLeaderboard(groupId, limit = 10) {
    const key = String(groupId);
    return Object.entries(db.users)
        .filter(([, acc]) => acc.groups && acc.groups.includes(key))
        .map(([id, acc]) => ({ id, total: acc.wallet + acc.bank, wallet: acc.wallet, bank: acc.bank }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}

function xpLeaderboard(limit = 10) {
    return Object.entries(db.users)
        .map(([id, acc]) => ({ id, xp: acc.xp, level: levelFromXp(acc.xp) }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

// ------------------------------------------------------------
// TRANSACTIONS / NET WORTH / INCOME / PROFILE / RANK
// ------------------------------------------------------------
function transactions(userId, limit = 10) {
    const acc = getAccount(userId);
    return acc.transactions.slice(0, limit);
}

function inventoryValue(acc) {
    return Object.entries(acc.inventory).reduce((sum, [key, qty]) => {
        const item = SHOP_ITEMS[key] || BLACKMARKET_ITEMS[key];
        return sum + (item ? item.sellback * qty : 0);
    }, 0);
}

function netWorth(userId) {
    const acc = getAccount(userId);
    const invValue = inventoryValue(acc);
    const debt = acc.loan ? acc.loan.owed : 0;
    const total = acc.wallet + acc.bank + invValue - debt;
    return { wallet: acc.wallet, bank: acc.bank, inventoryValue: invValue, debt, total };
}

function passiveIncomeRate(acc) {
    return Object.entries(acc.inventory).reduce((sum, [key, qty]) => {
        const item = SHOP_ITEMS[key];
        return sum + (item && item.income ? item.income * qty : 0);
    }, 0);
}

function claimPayday(userId) {
    const acc = getAccount(userId);
    const rate = passiveIncomeRate(acc);
    if (rate <= 0) return { ok: false, reason: "You don't own any income-generating assets yet. Check /shop for houses & shops." };

    const now = Date.now();
    if (now - acc.lastPayday < CONFIG.paydayCooldownMs) {
        return { ok: false, reason: `On cooldown — ${fmtTime(CONFIG.paydayCooldownMs - (now - acc.lastPayday))} left.` };
    }
    acc.lastPayday = now;
    acc.wallet += rate;
    logTx(acc, "payday", rate);
    save();
    return { ok: true, amount: rate };
}

const RICH_TIERS = [
    { min: 0, label: "🥔 Broke" },
    { min: 2000, label: "🌱 Getting By" },
    { min: 10000, label: "💵 Comfortable" },
    { min: 50000, label: "💰 Wealthy" },
    { min: 200000, label: "🏦 Rich" },
    { min: 1000000, label: "👑 Tycoon" }
];

function richTier(userId) {
    const nw = netWorth(userId).total;
    let tier = RICH_TIERS[0];
    for (const t of RICH_TIERS) if (nw >= t.min) tier = t;
    return { total: nw, tier: tier.label };
}

function profile(userId) {
    const acc = getAccount(userId);
    const level = levelFromXp(acc.xp);
    return {
        wallet: acc.wallet,
        bank: acc.bank,
        xp: acc.xp,
        level,
        nextLevelXp: xpForNextLevel(level),
        streak: getStreak(userId),
        wins: acc.wins,
        losses: acc.losses,
        loan: acc.loan,
        inventoryCount: Object.values(acc.inventory).reduce((a, b) => a + b, 0)
    };
}

function rank(userId) {
    const board = xpLeaderboard(Object.keys(db.users).length || 1);
    const idx = board.findIndex(e => e.id === String(userId));
    const acc = getAccount(userId);
    return {
        position: idx === -1 ? board.length + 1 : idx + 1,
        of: board.length,
        xp: acc.xp,
        level: levelFromXp(acc.xp)
    };
}

module.exports = {
    CONFIG,
    SHOP_ITEMS,
    BLACKMARKET_ITEMS,
    getAccount,
    trackGroup,
    fmtTime,
    getBalance,
    deposit,
    withdraw,
    give,
    claimDaily,
    getStreak,
    work,
    crime,
    hustle,
    rob,
    hijack,
    requestLoan,
    repayLoan,
    myLoan,
    gamble,
    coinflip,
    slots,
    blackjack,
    listShop,
    listBlackmarket,
    buyItem,
    sellItem,
    inventory,
    buyBlackmarket,
    createAuction,
    bidAuction,
    listAuctions,
    leaderboard,
    groupLeaderboard,
    xpLeaderboard,
    transactions,
    netWorth,
    claimPayday,
    richTier,
    profile,
    rank
};
