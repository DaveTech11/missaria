// ============================================================
// Miss Aria Adventures — Generic Adventure Engine
// games/engine.js
//
// Every game built with buildAdventure() shares one battle-tested
// start()/handleInput()/getKeyboard() implementation, so a new
// game can be added by describing its theme/data instead of
// re-writing (and re-breaking) input handling from scratch.
//
// No-emoji build: all button labels and output text are plain text.
// ============================================================

const EXIT_WORDS = ["quit", "exit", "leave", "stop"];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildAdventure(cfg) {
    const {
        id,
        title,
        description,
        resourceName,      // e.g. "Gold", "Supplies", "Rations"
        enemyNames,         // array of flavor enemy names
        locationNames,      // array of flavor location names
        lootNames,          // array of flavor loot item names
        bossName,
        winsToBoss = 4
    } = cfg;

    const mainKeyboard = [
        ["Explore", "Fight"],
        [resourceName, "Rest"],
        ["Boss", "Status"],
        ["Quit"]
    ];

    function statusText(session) {
        const s = session.state;
        return (
            `${title} — Status\n\n` +
            `HP: ${s.hp}/${s.maxHp}\n` +
            `Level: ${s.level} (XP ${s.xp}/${s.level * 100})\n` +
            `${resourceName}: ${s.resource}\n` +
            `Wins: ${s.wins}\n` +
            (s.bossDefeated ? `${bossName} defeated!\n` : "")
        );
    }

    function levelUpIfReady(session) {
        const s = session.state;
        let leveled = false;
        while (s.xp >= s.level * 100) {
            s.xp -= s.level * 100;
            s.level += 1;
            s.maxHp += 15;
            s.hp = s.maxHp;
            leveled = true;
        }
        return leveled;
    }

    function start(session) {
        session.state = {
            hp: 100,
            maxHp: 100,
            level: 1,
            xp: 0,
            resource: 10,
            wins: 0,
            bossDefeated: false,
            inventory: []
        };
        return {
            text:
                `${title}\n\n${description}\n\n` +
                `Commands: Explore - Fight - ${resourceName} - Rest - Boss (after ${winsToBoss} wins) - Status - Quit`
        };
    }

    function explore(session) {
        const s = session.state;
        const loc = pick(locationNames);
        const roll = Math.random();

        if (roll < 0.4) {
            const loot = pick(lootNames);
            const amt = Math.floor(Math.random() * 20) + 5;
            s.resource += amt;
            s.inventory.push(loot);
            return {
                text: `You explore ${loc} and find ${loot}!\n+${amt} ${resourceName} (total: ${s.resource})`
            };
        }
        if (roll < 0.75) {
            const enemy = pick(enemyNames);
            s.pendingEnemy = { name: enemy, hp: 20 + s.level * 8 };
            return {
                text: `While exploring ${loc}, a ${enemy} appears!\nUse Fight to engage, or Rest to retreat.`
            };
        }
        return {
            text: `You explore ${loc} but find nothing of note. The area is quiet.`
        };
    }

    function fight(session, opts = {}) {
        const s = session.state;
        const isBoss = !!opts.boss;

        if (isBoss && s.wins < winsToBoss) {
            return {
                text: `${bossName} won't show themselves yet. Defeat ${winsToBoss - s.wins} more enemy(ies) first (Wins: ${s.wins}/${winsToBoss}).`
            };
        }

        let enemy = s.pendingEnemy;
        if (isBoss) {
            enemy = { name: bossName, hp: 80 + s.level * 15, boss: true };
        }
        if (!enemy) {
            const name = pick(enemyNames);
            enemy = { name, hp: 20 + s.level * 8 };
        }

        const playerDmg = Math.floor(Math.random() * 15) + 8 + s.level * 2;
        const enemyDmg = Math.floor(Math.random() * 10) + 5;
        enemy.hp -= playerDmg;
        let text = `You strike the ${enemy.name} for ${playerDmg} damage!\n`;

        if (enemy.hp <= 0) {
            const xpGain = enemy.boss ? 250 : 40 + s.level * 5;
            const goldGain = enemy.boss ? 100 : 15 + Math.floor(Math.random() * 15);
            s.xp += xpGain;
            s.resource += goldGain;
            s.wins += 1;
            s.pendingEnemy = null;
            text += `\nThe ${enemy.name} is defeated! +${xpGain} XP, +${goldGain} ${resourceName}`;
            if (enemy.boss) {
                s.bossDefeated = true;
                text += `\n\nYou have defeated ${bossName}! Legendary victory! Keep playing to go again, or Quit.`;
            }
            if (levelUpIfReady(session)) {
                text += `\n\nLEVEL UP! You are now level ${s.level}. Full HP restored.`;
            }
            return { text };
        }

        s.hp -= enemyDmg;
        s.pendingEnemy = enemy;
        text += `${enemy.name} hits back for ${enemyDmg} damage. (Their HP: ${Math.max(0, enemy.hp)}, Your HP: ${Math.max(0, s.hp)})`;

        if (s.hp <= 0) {
            s.hp = Math.floor(s.maxHp * 0.5);
            s.pendingEnemy = null;
            text += `\n\nYou were defeated and barely escape! HP restored to half (${s.hp}/${s.maxHp}). Try Rest before your next fight.`;
        }
        return { text };
    }

    function rest(session) {
        const s = session.state;
        if (s.hp >= s.maxHp) {
            return { text: `You are already at full health (${s.hp}/${s.maxHp}).` };
        }
        const healed = Math.min(s.maxHp - s.hp, 25);
        s.hp += healed;
        s.pendingEnemy = null;
        return { text: `You rest and recover ${healed} HP. (${s.hp}/${s.maxHp})` };
    }

    function resourceScreen(session) {
        const s = session.state;
        return {
            text:
                `${resourceName}: ${s.resource}\n\n` +
                (s.inventory.length
                    ? `Items found:\n${s.inventory.slice(-10).map(i => `- ${i}`).join("\n")}`
                    : `No items yet — try Explore.`)
        };
    }

    function handleInput(session, input) {
        const text = String(input || "").toLowerCase().trim();
        if (!session.state) start(session);

        if (EXIT_WORDS.includes(text)) {
            return { text: `You step away from ${title}. Send "${id}" any time to continue your adventure.`, end: true };
        }

        if (text.includes("explore")) return explore(session);
        if (text.includes("fight") && !text.includes("boss")) return fight(session);
        if (text.includes("boss")) return fight(session, { boss: true });
        if (text.includes("rest")) return rest(session);
        if (text.includes("status")) return { text: statusText(session) };
        if (text.includes(resourceName.toLowerCase())) return resourceScreen(session);

        return {
            text: `I didn't catch that. Try: Explore - Fight - ${resourceName} - Rest - Boss - Status - Quit`
        };
    }

    function getKeyboard() {
        return mainKeyboard;
    }

    return { id, start, handleInput, getKeyboard };
}

module.exports = { buildAdventure };
