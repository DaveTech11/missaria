// ============================================================
// wallet.js
// Registers all cash-economy commands (/balance, /wallet, /daily,
// /work, /crime, /gamble, /shop, /auction, /leaderboard, etc).
// Backed by services/walletService.js. Wired up the same way as
// features.js / features2.js / features3.js:
//   require("./wallet")(bot, { escapeHtml, resolveGroupTarget });
// ============================================================

const W = require("./services/walletService");

module.exports = function (bot, helpers) {
    const { escapeHtml, resolveGroupTarget } = helpers;

    const fmt = (n) => `$${Math.round(n).toLocaleString()}`;

    function nameOf(user) {
        return user.username ? `@${user.username}` : (user.first_name || String(user.id));
    }

    async function displayName(bot, chatId, id) {
        try {
            const member = await bot.getChatMember(chatId, id);
            return nameOf(member.user);
        } catch {
            return String(id);
        }
    }

    /* ---- /balance ---- */
    bot.onText(/^\/balance(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        W.trackGroup(userId, chatId);

        const bal = W.getBalance(userId);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💵 <b>Balance</b>

👛 Wallet: ${fmt(bal.wallet)}
🏦 Bank: ${fmt(bal.bank)} / ${fmt(bal.bankCap)}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /wallet — full dashboard ---- */
    bot.onText(/^\/wallet(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        W.trackGroup(userId, chatId);

        const bal = W.getBalance(userId);
        const nw = W.netWorth(userId);
        const loan = W.myLoan(userId);
        const streak = W.getStreak(userId);

        let loanLine = "None";
        if (loan) {
            const remaining = loan.dueAt - Date.now();
            loanLine = `${fmt(loan.owed)} owed (${remaining > 0 ? W.fmtTime(remaining) + " left" : "OVERDUE"})`;
        }

        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💳 <b>${escapeHtml(msg.from.first_name || "Wallet")}'s Dashboard</b>

👛 Wallet: ${fmt(bal.wallet)}
🏦 Bank: ${fmt(bal.bank)} / ${fmt(bal.bankCap)}
📦 Inventory Value: ${fmt(nw.inventoryValue)}
💎 Net Worth: ${fmt(nw.total)}

🔥 Daily Streak: ${streak} day${streak === 1 ? "" : "s"}
💳 Loan: ${loanLine}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /daily ---- */
    bot.onText(/^\/daily(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        W.trackGroup(userId, chatId);

        const res = W.claimDaily(userId);
        if (!res.ok) {
            return bot.sendMessage(chatId, `⏳ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }

        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🎉 <b>Daily Reward Claimed!</b>

💵 +${fmt(res.amount)}
🔥 Streak: ${res.streak} day${res.streak === 1 ? "" : "s"} (+${fmt(res.bonus)} bonus)

Come back tomorrow for more! 🌸
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /streak ---- */
    bot.onText(/^\/streak(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const streak = W.getStreak(msg.from.id);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🔥 <b>Daily Streak</b>

${streak} day${streak === 1 ? "" : "s"} in a row.
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /work ---- */
    bot.onText(/^\/work(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        W.trackGroup(userId, chatId);

        const res = W.work(userId);
        if (!res.ok) {
            return bot.sendMessage(chatId, `⏳ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💼 <b>You clocked in.</b>

Salary: +${fmt(res.amount)}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /crime ---- */
    bot.onText(/^\/crime(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        W.trackGroup(userId, chatId);

        const res = W.crime(userId);
        if (!res.ok) {
            return bot.sendMessage(chatId, `⏳ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        if (res.success) {
            await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🕵️ <b>Job's done, clean getaway.</b>

Take: +${fmt(res.amount)}
</blockquote>`,
                { parse_mode: "HTML", reply_to_message_id: msg.message_id }
            );
        } else {
            await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🚨 <b>Busted!</b>

Fine: -${fmt(res.lost)}
</blockquote>`,
                { parse_mode: "HTML", reply_to_message_id: msg.message_id }
            );
        }
    });

    /* ---- /hustle ---- */
    bot.onText(/^\/hustle(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        W.trackGroup(userId, chatId);

        const res = W.hustle(userId);
        if (!res.ok) {
            return bot.sendMessage(chatId, `⏳ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
⚡ <b>Side hustle paid off.</b>

+${fmt(res.amount)}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /deposit <amt> ---- */
    bot.onText(/^\/deposit(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const arg = (match[1] || "").trim().toLowerCase();
        const bal = W.getBalance(msg.from.id);
        const amount = arg === "all" ? bal.wallet : parseInt(arg, 10);

        if (!amount || amount <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/deposit &lt;amount|all&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.deposit(msg.from.id, amount);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId, `🏦 Deposited ${fmt(amount)} into your bank.`, { reply_to_message_id: msg.message_id });
    });

    /* ---- /withdraw <amt> ---- */
    bot.onText(/^\/withdraw(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const arg = (match[1] || "").trim().toLowerCase();
        const bal = W.getBalance(msg.from.id);
        const amount = arg === "all" ? bal.bank : parseInt(arg, 10);

        if (!amount || amount <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/withdraw &lt;amount|all&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.withdraw(msg.from.id, amount);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId, `👛 Withdrew ${fmt(amount)} to your wallet.`, { reply_to_message_id: msg.message_id });
    });

    /* ---- /give <amt> (reply to user) ---- */
    bot.onText(/^\/give(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!msg.reply_to_message) {
            return bot.sendMessage(chatId, "❌ Reply to the user you want to send money to with <code>/give &lt;amount&gt;</code>.", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const target = msg.reply_to_message.from;
        const amount = parseInt((match[1] || "").trim(), 10);
        if (!amount || amount <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: reply with <code>/give &lt;amount&gt;</code>.", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.give(msg.from.id, target.id, amount);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId, `💸 Sent ${fmt(amount)} to ${nameOf(target)}.`, { reply_to_message_id: msg.message_id });
    });

    /* ---- /rob (reply to user) ---- */
    bot.onText(/^\/rob(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.reply_to_message) {
            return bot.sendMessage(chatId, "❌ Reply to the user you want to rob with /rob.", { reply_to_message_id: msg.message_id });
        }
        const target = msg.reply_to_message.from;
        const res = W.rob(msg.from.id, target.id);
        if (!res.ok) {
            return bot.sendMessage(chatId, `⏳ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        if (res.success) {
            await bot.sendMessage(chatId, `🥷 You robbed ${nameOf(target)} for ${fmt(res.amount)}!`, { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId, `🚨 You got caught robbing ${nameOf(target)} and paid a fine of ${fmt(res.lost)}.`, { reply_to_message_id: msg.message_id });
        }
    });

    /* ---- /loan <amt> ---- */
    bot.onText(/^\/loan(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const amount = parseInt((match[1] || "").trim(), 10);
        if (!amount || amount <= 0) {
            return bot.sendMessage(chatId, `❌ Usage: <code>/loan &lt;amount&gt;</code> (max ${fmt(W.CONFIG.loanMaxAmount)}).`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.requestLoan(msg.from.id, amount);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💳 <b>Loan Approved</b>

Borrowed: ${fmt(res.amount)}
Owed back: ${fmt(res.owed)} (${Math.round(W.CONFIG.loanInterestRate * 100)}% interest)
Due in: ${W.fmtTime(W.CONFIG.loanDueMs)}

Repay with /repayloan &lt;amount&gt;
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /repayloan <amt> ---- */
    bot.onText(/^\/repayloan(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const arg = (match[1] || "").trim().toLowerCase();
        const loan = W.myLoan(msg.from.id);
        const amount = arg === "all" && loan ? loan.owed : parseInt(arg, 10);

        if (!amount || amount <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/repayloan &lt;amount|all&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.repayLoan(msg.from.id, amount);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId,
            res.cleared
                ? `✅ Paid ${fmt(res.paid)} — loan fully cleared! 🎉`
                : `✅ Paid ${fmt(res.paid)}. Remaining balance: ${fmt(res.remaining)}.`,
            { reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /myloan ---- */
    bot.onText(/^\/myloan(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const loan = W.myLoan(msg.from.id);
        if (!loan) {
            return bot.sendMessage(chatId, "✅ You have no active loan.", { reply_to_message_id: msg.message_id });
        }
        const remaining = loan.dueAt - Date.now();
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💳 <b>Active Loan</b>

Principal: ${fmt(loan.principal)}
Owed: ${fmt(loan.owed)}
${remaining > 0 ? `Due in: ${W.fmtTime(remaining)}` : "⚠️ OVERDUE"}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /gamble <bet> ---- */
    bot.onText(/^\/bet(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const bet = parseInt((match[1] || "").trim(), 10);
        if (!bet || bet <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/bet &lt;bet&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.gamble(msg.from.id, bet);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId,
            res.won ? `🎲 You won ${fmt(res.amount)}!` : `🎲 You lost ${fmt(res.amount)}.`,
            { reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /coinflip h|t <bet> ---- */
    bot.onText(/^\/coinflip2(?:@\w+)?(?:\s+(\S+)\s+(\S+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const side = (match[1] || "").toLowerCase();
        const bet = parseInt(match[2], 10);
        if (!["h", "t"].includes(side) || !bet || bet <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/coinflip2 heads or tails h|t &lt;bet&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.coinflip(msg.from.id, side, bet);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        const landed = res.result === "h" ? "Heads" : "Tails";
        await bot.sendMessage(chatId,
            `🪙 Landed on <b>${landed}</b> — ${res.won ? `you won ${fmt(res.amount)}!` : `you lost ${fmt(res.amount)}.`}`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /slots <bet> ---- */
    bot.onText(/^\/slotsbet(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const bet = parseInt((match[1] || "").trim(), 10);
        if (!bet || bet <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/slotsbet &lt;bet&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.slots(msg.from.id, bet);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🎰 [ ${res.reels.join(" | ")} ]

${res.won ? `You won ${fmt(res.amount)}!` : `You lost ${fmt(bet)}.`}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });
bot.onText(/^\/hijack(?:@\w+)?(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, "❌ Reply to the user you want to hijack with /hijack.", { reply_to_message_id: msg.message_id });
    }
    const target = msg.reply_to_message.from;
    const res = W.hijack(msg.from.id, target.id);
    if (!res.ok) {
        return bot.sendMessage(chatId, `⏳ ${res.reason}`, { reply_to_message_id: msg.message_id });
    }

    if (!res.hijacked) {
        return bot.sendMessage(chatId,
`<blockquote expandable='true'>
🚫 <b>Hijack Failed</b>

${nameOf(target)} only has ${fmt(res.targetNetWorth)} net worth — not worth the risk. Needs at least ${fmt(W.CONFIG.hijackMinNetWorth)} to be a target.
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    }

    await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💥 <b>HIJACKED!</b>

You drained ${nameOf(target)}'s entire wallet and bank.

👛 Wallet taken: ${fmt(res.takenWallet)}
🏦 Bank taken: ${fmt(res.takenBank)}
💰 Total: ${fmt(res.amount)}
</blockquote>`,
        { parse_mode: "HTML", reply_to_message_id: msg.message_id }
    );
});
    /* ---- /blackjack <bet> ---- */
    bot.onText(/^\/blackjack(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const bet = parseInt((match[1] || "").trim(), 10);
        if (!bet || bet <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/blackjack &lt;bet&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.blackjack(msg.from.id, bet);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        const outcome = res.result === "win" ? `You won ${fmt(res.amount)}! 🎉`
            : res.result === "lose" ? `You lost ${fmt(bet)}.`
            : "Push — bet returned.";
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🃏 <b>Blackjack</b>

You: ${res.player.total} (${res.player.cards.join(", ")})
Dealer: ${res.dealer.total} (${res.dealer.cards.join(", ")})

${outcome}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /shop ---- */
    bot.onText(/^\/shop(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const items = W.listShop();
        const lines = Object.entries(items).map(([key, it]) =>
            `${it.name} — ${fmt(it.price)} <code>${key}</code>${it.income ? ` (+${fmt(it.income)}/payday)` : ""}`
        );
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🛍️ <b>Shop</b>

${lines.join("\n")}

Buy: <code>/market buy &lt;item&gt; [qty]</code>
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /inventory ---- */
    bot.onText(/^\/inventory(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const items = W.inventory(msg.from.id);
        if (!items.length) {
            return bot.sendMessage(chatId, "📦 Your inventory is empty. Check /shop!", { reply_to_message_id: msg.message_id });
        }
        const lines = items.map(({ key, qty, item }) => `${item ? item.name : key} x${qty}`);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
📦 <b>Inventory</b>

${lines.join("\n")}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /sell <item> [qty] ---- */
    bot.onText(/^\/sell(?:@\w+)?(?:\s+(\S+)(?:\s+(\d+))?)?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const key = (match[1] || "").toLowerCase();
        const qty = match[2] ? parseInt(match[2], 10) : 1;
        if (!key) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/sell &lt;item&gt; [qty]</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        const res = W.sellItem(msg.from.id, key, qty);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId, `💰 Sold ${res.item.name} x${res.qty} for ${fmt(res.value)}.`, { reply_to_message_id: msg.message_id });
    });

    /* ---- /market — view or buy ---- */
    bot.onText(/^\/market(?:@\w+)?(?:\s+(buy)\s+(\S+)(?:\s+(\d+))?)?$/i, async (msg, match) => {
        const chatId = msg.chat.id;

        if (match[1]) {
            const key = match[2].toLowerCase();
            const qty = match[3] ? parseInt(match[3], 10) : 1;
            const res = W.buyItem(msg.from.id, key, qty);
            if (!res.ok) {
                return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
            }
            return bot.sendMessage(chatId, `✅ Bought ${res.item.name} x${res.qty} for ${fmt(res.cost)}.`, { reply_to_message_id: msg.message_id });
        }

        const items = W.listShop();
        const lines = Object.entries(items).map(([key, it]) => `${it.name} — ${fmt(it.price)} <code>${key}</code>`);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🏬 <b>Market</b>

${lines.join("\n")}

Buy: <code>/market buy &lt;item&gt; [qty]</code>
Sell: <code>/sell &lt;item&gt; [qty]</code>
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /blackmarket — view or buy ---- */
    bot.onText(/^\/shadowmarket(?:@\w+)?(?:\s+(buy)\s+(\S+)(?:\s+(\d+))?)?$/i, async (msg, match) => {
        const chatId = msg.chat.id;

        if (match[1]) {
            const key = match[2].toLowerCase();
            const qty = match[3] ? parseInt(match[3], 10) : 1;
            const res = W.buyBlackmarket(msg.from.id, key, qty);
            if (!res.ok) {
                return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
            }
            if (res.busted) {
                return bot.sendMessage(chatId, `🚔 Deal went sideways — you got busted and fined ${fmt(res.fine)}.`, { reply_to_message_id: msg.message_id });
            }
            return bot.sendMessage(chatId, `🕶️ Bought ${res.item.name} x${res.qty} for ${fmt(res.cost)}, no questions asked.`, { reply_to_message_id: msg.message_id });
        }

        const items = W.listBlackmarket();
        const lines = Object.entries(items).map(([key, it]) =>
            `${it.name} — ${fmt(it.price)} <code>${key}</code> (${Math.round(it.bustChance * 100)}% bust risk)`
        );
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🕶️ <b>Black Market</b>
<i>Risky goods. Buying can get you busted.</i>

${lines.join("\n")}

Buy: <code>/blackmarket buy &lt;item&gt; [qty]</code>
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /auction — list / create / bid ---- */
    bot.onText(/^\/auction(?:@\w+)?(?:\s+(.+))?$/i, async (msg, match) => {
        const chatId = msg.chat.id;
        const args = (match[1] || "").trim().split(/\s+/).filter(Boolean);
        const sub = (args[0] || "").toLowerCase();

        if (sub === "create") {
            const key = (args[1] || "").toLowerCase();
            const qty = parseInt(args[2], 10) || 1;
            const minBid = parseInt(args[3], 10) || 1;
            const res = W.createAuction(msg.from.id, key, qty, minBid);
            if (!res.ok) return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
            return bot.sendMessage(chatId, `🔨 Auction #${res.id} created: ${res.item.name} x${res.qty}, min bid ${fmt(minBid)}.`, { reply_to_message_id: msg.message_id });
        }

        if (sub === "bid") {
            const id = parseInt(args[1], 10);
            const amount = parseInt(args[2], 10);
            const res = W.bidAuction(msg.from.id, id, amount);
            if (!res.ok) return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
            return bot.sendMessage(chatId, `✅ Bid ${fmt(amount)} placed on auction #${id}.`, { reply_to_message_id: msg.message_id });
        }

        const list = W.listAuctions();
        if (!list.length) {
            return bot.sendMessage(chatId,
`<blockquote expandable='true'>
🔨 <b>Auction House</b>

No active auctions.

Create: <code>/auction create &lt;item&gt; &lt;qty&gt; &lt;minbid&gt;</code>
Bid: <code>/auction bid &lt;id&gt; &lt;amount&gt;</code>
</blockquote>`,
                { parse_mode: "HTML", reply_to_message_id: msg.message_id }
            );
        }
        const lines = list.map(a => {
            const item = W.SHOP_ITEMS[a.key] || W.BLACKMARKET_ITEMS[a.key];
            const remaining = a.endsAt - Date.now();
            return `#${a.id} ${item ? item.name : a.key} x${a.qty} — high bid ${fmt(a.highestBid || a.minBid)} — ${W.fmtTime(remaining)} left`;
        });
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🔨 <b>Auction House</b>

${lines.join("\n")}

Bid: <code>/auction bid &lt;id&gt; &lt;amount&gt;</code>
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /leaderboard ---- */
    bot.onText(/^\/leaderboard(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const board = W.leaderboard(10);
        if (!board.length) return bot.sendMessage(chatId, "📊 No data yet.", { reply_to_message_id: msg.message_id });

        const lines = await Promise.all(board.map(async (e, i) =>
            `${i + 1}. ${await displayName(bot, chatId, e.id)} — ${fmt(e.total)}`
        ));
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🏆 <b>Global Leaderboard</b>

${lines.join("\n")}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /groupleaderboard ---- */
    bot.onText(/^\/groupleaderboard(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        if (msg.chat.type === "private") {
            return bot.sendMessage(chatId, "❌ This command only works in groups.", { reply_to_message_id: msg.message_id });
        }
        const board = W.groupLeaderboard(chatId, 10);
        if (!board.length) return bot.sendMessage(chatId, "📊 No data yet for this group.", { reply_to_message_id: msg.message_id });

        const lines = await Promise.all(board.map(async (e, i) =>
            `${i + 1}. ${await displayName(bot, chatId, e.id)} — ${fmt(e.total)}`
        ));
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
🏆 <b>${escapeHtml(msg.chat.title || "Group")} Leaderboard</b>

${lines.join("\n")}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /xplb ---- */
    bot.onText(/^\/xplb(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const board = W.xpLeaderboard(10);
        if (!board.length) return bot.sendMessage(chatId, "📊 No data yet.", { reply_to_message_id: msg.message_id });

        const lines = await Promise.all(board.map(async (e, i) =>
            `${i + 1}. ${await displayName(bot, chatId, e.id)} — Lv.${e.level} (${e.xp.toLocaleString()} XP)`
        ));
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
⭐ <b>XP Leaderboard</b>

${lines.join("\n")}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /transactions ---- */
    bot.onText(/^\/transactions(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const txs = W.transactions(msg.from.id, 10);
        if (!txs.length) return bot.sendMessage(chatId, "📜 No transactions yet.", { reply_to_message_id: msg.message_id });

        const lines = txs.map(t => {
            const sign = t.amount > 0 ? "+" : "";
            const when = new Date(t.ts).toLocaleString();
            return `${t.amount >= 0 ? "🟢" : "🔴"} ${t.type} ${sign}${fmt(t.amount)} ${t.note ? `(${escapeHtml(t.note)})` : ""} — <i>${when}</i>`;
        });
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
📜 <b>Recent Transactions</b>

${lines.join("\n")}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /networth ---- */
    bot.onText(/^\/networth(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const nw = W.netWorth(msg.from.id);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
💎 <b>Net Worth</b>

Wallet: ${fmt(nw.wallet)}
Bank: ${fmt(nw.bank)}
Inventory: ${fmt(nw.inventoryValue)}
Debt: -${fmt(nw.debt)}

Total: ${fmt(nw.total)}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /income /payday — passive income ---- */
    bot.onText(/^\/(income|payday)(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const res = W.claimPayday(msg.from.id);
        if (!res.ok) {
            return bot.sendMessage(chatId, `❌ ${res.reason}`, { reply_to_message_id: msg.message_id });
        }
        await bot.sendMessage(chatId, `🏠 Payday! Your assets generated ${fmt(res.amount)}.`, { reply_to_message_id: msg.message_id });
    });

    /* ---- /richme ---- */
    bot.onText(/^\/richness(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const res = W.richTier(msg.from.id);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
${res.tier}

Net Worth: ${fmt(res.total)}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /profile ---- */
    bot.onText(/^\/profile2(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const p = W.profile(msg.from.id);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
👤 <b>${escapeHtml(msg.from.first_name || "Profile2")}</b>

👛 Wallet: ${fmt(p.wallet)}
🏦 Bank: ${fmt(p.bank)}
⭐ Level: ${p.level} (${p.xp.toLocaleString()} / ${p.nextLevelXp.toLocaleString()} XP)
🔥 Streak: ${p.streak} day${p.streak === 1 ? "" : "s"}
🏅 Wins/Losses: ${p.wins}/${p.losses}
📦 Inventory: ${p.inventoryCount} item${p.inventoryCount === 1 ? "" : "s"}
💳 Loan: ${p.loan ? fmt(p.loan.owed) + " owed" : "None"}
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /rank ---- */
    bot.onText(/^\/rank(?:@\w+)?(?:\s|$)/, async (msg) => {
        const chatId = msg.chat.id;
        const r = W.rank(msg.from.id);
        await bot.sendMessage(chatId,
`<blockquote expandable='true'>
📈 <b>Rank</b>

#${r.position} of ${r.of}
Level ${r.level} — ${r.xp.toLocaleString()} XP
</blockquote>`,
            { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
    });

    /* ---- /donate <amount> — Telegram Stars ---- */
    bot.onText(/^\/give(?:@\w+)?(?:\s+(\d+))?$/, async (msg, match) => {
        const chatId = msg.chat.id;
        const amount = match[1] ? parseInt(match[1], 10) : 50;
        if (amount <= 0) {
            return bot.sendMessage(chatId, "❌ Usage: <code>/give &lt;amount&gt;</code>", { parse_mode: "HTML", reply_to_message_id: msg.message_id });
        }
        try {
            await bot.sendInvoice(
                chatId,
                "Support the Bot ⭐️",
                "Thank you for keeping this bot alive and running!",
                "donate",
                "",
                "XTR",
                [{ label: "Donation", amount }],
                { reply_to_message_id: msg.message_id }
            );
        } catch (err) {
            await bot.sendMessage(chatId, `❌ Couldn't create the donation invoice: ${err.message}`, { reply_to_message_id: msg.message_id });
        }
    });

    // Telegram Stars checkout handshake
    bot.on("pre_checkout_query", async (query) => {
        try {
            await bot.answerPreCheckoutQuery(query.id, true);
        } catch (err) {
            console.log("PRE_CHECKOUT ERROR:", err);
        }
    });

    bot.on("successful_payment", async (msg) => {
        await bot.sendMessage(msg.chat.id,
            `⭐ Thank you for donating ${msg.successful_payment.total_amount} Stars! It really helps. 🙏`,
            { reply_to_message_id: msg.message_id }
        );
    });
};
