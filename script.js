const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Enhanced Game State
let gameMode = "";
let gameRunning = false;
let gamePaused = false;
let gameTime = 0;
let score = 0;
let level = 1;
let combo = 0;
let comboTimer = 0;
let enemiesDefeated = 0;
let itemsCollected = 0;
let soundEnabled = true;
let screenShakeAmount = 0;
let dragonLevelUpEffect = 0;
let skillPoints = 0;
let collectedItems = new Set();

// Shop System - Βελτιωμένο με HORNS και WING SKINS
let gold = 100;
let ownedItems = [];
let equippedItems = {
    glasses: null,
    horns: null,
    wings: null
};
let purchaseHistory = [];

// Enhanced Dragon Customization
const dragonCustomization = {
    color: "#ff6b6b",
    size: 35,
    skills: {
        fire1: false,
        fire2: false,
        speed1: false,
        speed2: false,
        health1: false,
        health2: false,
    },
};

// Enhanced Dragon with Wings Animation
const dragon = {
    segments: [],
    segmentCount: 30,
    segmentLength: 15,
    headSize: 35,
    baseSpeed: 5,
    speed: 5,
    health: 100,
    maxHealth: 100,
    fireRate: 1,
    speedBoost: 1,
    invulnerable: 0,
    trail: [],
    hasPowerUp: false,
    customColor: "#ff6b6b",
    wingFlap: 0,
    wingFlapSpeed: 0.15,
};

// Mouse
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

// Enhanced Game Objects
let collectibles = [];
let enemies = [];
let obstacles = [];
let powerUps = [];
let fireParticles = [];
let particles = [];
let boss = null;
let environment = [];

// Enhanced Achievements
const achievements = {
    firstBlood: { unlocked: false, name: "First Blood", desc: "Σκότωσε τον πρώτο εχθρό" },
    speedDemon: { unlocked: false, name: "Speed Demon", desc: "Φτάσε level 10" },
    survivor: { unlocked: false, name: "Survivor", desc: "Επιβίωσε με κάτω από 20 HP" },
    collector: { unlocked: false, name: "Collector", desc: "Μάζεψε 50 items" },
    bossSlayer: { unlocked: false, name: "Boss Slayer", desc: "Νίκησε έναν Boss" },
    dragonArtist: { unlocked: false, name: "Dragon Artist", desc: "Προσάρμοσε πλήρως τον δράκο σου" },
    treasureHunter: {
        unlocked: false,
        name: "Treasure Hunter",
        desc: "Μάζεψε 10 μοναδικά collectibles",
    },
    comboKing: { unlocked: false, name: "Combo King", desc: "Φτάσε 15x combo" },
    levelMaster: { unlocked: false, name: "Level Master", desc: "Φτάσε level 20" },
    skillMaster: { unlocked: false, name: "Skill Master", desc: "Αγόρασε όλες τις ικανότητες" },
};

// Audio Context
const audioCtx = new(window.AudioContext || window.webkitAudioContext)();

// Sound Functions
function playSound(freq, duration, type = "sine", volume = 0.15, vibrato = false) {
    if (!soundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        if (vibrato) {
            const vibratoGain = audioCtx.createGain();
            const vibratoOsc = audioCtx.createOscillator();
            vibratoOsc.frequency.value = 5;
            vibratoGain.gain.value = freq * 0.02;
            vibratoOsc.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibratoOsc.start();
            vibratoOsc.stop(audioCtx.currentTime + duration);
        }

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = type;

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function collectSound() {
    playSound(523, 0.15, "sine", 0.08);
    setTimeout(() => playSound(659, 0.1, "sine", 0.06), 50);
}

function powerUpSound() {
    playSound(784, 0.3, "sine", 0.1, true);
    setTimeout(() => playSound(1047, 0.2, "sine", 0.08), 100);
}

function hitSound() {
    playSound(220, 0.2, "sine", 0.06);
    playSound(165, 0.25, "sine", 0.04);
}

function fireSound() {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            playSound(110 + Math.random() * 50, 0.2, "sawtooth", 0.04);
        }, i * 30);
    }
}

function enemyDefeatSound() {
    playSound(392, 0.3, "sine", 0.08);
    setTimeout(() => playSound(294, 0.2, "sine", 0.06), 80);
}

function healSound() {
    playSound(659, 0.25, "sine", 0.08);
    setTimeout(() => playSound(784, 0.2, "sine", 0.06), 60);
    setTimeout(() => playSound(1047, 0.15, "sine", 0.04), 120);
}

function achievementSound() {
    playSound(523, 0.4, "sine", 0.1);
    playSound(659, 0.4, "sine", 0.09);
    playSound(784, 0.4, "sine", 0.08);
}

function bossDefeatSound() {
    playSound(523, 0.3, "sine", 0.12);
    setTimeout(() => playSound(659, 0.3, "sine", 0.1), 150);
    setTimeout(() => playSound(784, 0.3, "sine", 0.1), 300);
    setTimeout(() => playSound(1047, 0.5, "sine", 0.12), 450);
}

function levelUpSound() {
    playSound(523, 0.2, "sine", 0.1);
    setTimeout(() => playSound(659, 0.2, "sine", 0.09), 100);
    setTimeout(() => playSound(784, 0.2, "sine", 0.08), 200);
    setTimeout(() => playSound(1047, 0.3, "sine", 0.1), 300);
}

// Toggle Sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById("soundButton");
    if (soundEnabled) {
        btn.textContent = "🔊 SOUND ON";
        btn.classList.remove("muted");
    } else {
        btn.textContent = "🔇 SOUND OFF";
        btn.classList.add("muted");
    }
}

// Toggle Pause
function togglePause() {
    if (!gameRunning) return;
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Update Pause Button
function updatePauseButton() {
    const btn = document.getElementById("pauseButton");
    if (gamePaused) {
        btn.textContent = "▶️ RESUME";
    } else {
        btn.textContent = "⏸️ PAUSE";
    }
}

// Βελτιωμένο Shop System με HORNS και WING SKINS
function showShop() {
    console.log("Opening shop");
    document.getElementById("shopMenu").style.display = "block";
    updateShopDisplay();
}

function closeShop() {
    console.log("Closing shop");
    document.getElementById("shopMenu").style.display = "none";
}

function updateShopDisplay() {
    // Ενημέρωση όλων των εμφανίσεων χρυσού
    document.getElementById("shopGold").textContent = gold;
    document.getElementById("menuGold").textContent = gold;
    document.getElementById("goldDisplay").textContent = gold;
    if (document.getElementById("finalGold")) {
        document.getElementById("finalGold").textContent = gold;
    }

    // Ενημέρωση κατηγοριών
    const categories = document.querySelectorAll(".shop-category");
    categories.forEach((cat) => {
        cat.addEventListener("click", function() {
            categories.forEach((c) => c.classList.remove("active"));
            this.classList.add("active");
            filterShopItems(this.dataset.category);
        });
    });

    // Ενημέρωση αντικειμένων
    const items = document.querySelectorAll(".shop-item");
    items.forEach((item) => {
        const itemId = item.dataset.item;
        const category = item.dataset.category;
        const isOwned = ownedItems.includes(itemId);
        const isEquipped = equippedItems[category] === itemId;

        item.innerHTML = `
            <div class="shop-item-icon ${itemId.replace(/_/g, "-")}-icon"></div>
            <div class="shop-item-name">${getItemName(itemId)}</div>
            <div class="shop-item-price">${item.dataset.price} <div class="coin-icon small"></div></div>
            ${isOwned ? '<div class="shop-item-owned">✅ Αγορασμένο</div>' : ""}
        `;

        if (isEquipped) {
            item.classList.add("equipped");
        } else {
            item.classList.remove("equipped");
        }

        item.onclick = function() {
            handleShopItemClick(itemId, category, parseInt(item.dataset.price));
        };
    });
}

function getItemName(itemId) {
    const names = {
        sunglasses: "Γυαλιά Ηλίου",
        nerd_glasses: "Γυαλιά Χαζού",
        vr_glasses: "VR Γυαλιά",
        demon_horns: "Κέρατα Δαίμονα",
        golden_horns: "Χρυσά Κέρατα",
        ice_horns: "Παγωμένα Κέρατα",
        fire_wings: "Φλογερά Φτερά",
        crystal_wings: "Κρυστάλλινα Φτερά",
        shadow_wings: "Σκοτεινά Φτερά"
    };
    return names[itemId] || "Αντικείμενο";
}

function filterShopItems(category) {
    const items = document.querySelectorAll(".shop-item");
    items.forEach((item) => {
        if (item.dataset.category === category) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

function handleShopItemClick(itemId, category, price) {
    if (ownedItems.includes(itemId)) {
        equipItem(itemId, category);
    } else {
        buyItem(itemId, category, price);
    }
}

function buyItem(itemId, category, price) {
    if (gold >= price) {
        gold -= price;
        ownedItems.push(itemId);

        purchaseHistory.push({
            itemId: itemId,
            category: category,
            price: price,
            timestamp: Date.now(),
        });

        equipItem(itemId, category);
        updateShopDisplay();
        playSound(784, 0.3, "sine", 0.1);
        console.log(`Purchased ${itemId} for ${price} gold`);
    } else {
        console.log("Not enough gold");
        playSound(220, 0.2, "sine", 0.05);
    }
}

function equipItem(itemId, category) {
    // Αν πατήσεις το ίδιο item που είναι ήδη equipped, το αφαιρείς (unequip)
    if (equippedItems[category] === itemId) {
        equippedItems[category] = null;
        console.log(`Unequipped ${itemId} from ${category} category`);
    } else {
        // Αλλιώς, φόρεσε το νέο item (αντικαθιστώντας οποιοδήποτε άλλο)
        equippedItems[category] = itemId;
        console.log(`Equipped ${itemId} in ${category} category`);
    }
    updateShopDisplay();
}

function unequipAll() {
    equippedItems = {
        glasses: null,
        horns: null,
        wings: null
    };
    updateShopDisplay();
    console.log("Unequipped all items");
}

function sellLastItem() {
    if (purchaseHistory.length === 0) {
        console.log("No purchases to cancel");
        playSound(220, 0.2, "sine", 0.05);
        return;
    }

    const lastPurchase = purchaseHistory.pop();
    const itemId = lastPurchase.itemId;
    const category = lastPurchase.category;
    const price = lastPurchase.price;

    gold += price;

    const itemIndex = ownedItems.indexOf(itemId);
    if (itemIndex > -1) {
        ownedItems.splice(itemIndex, 1);
    }

    if (equippedItems[category] === itemId) {
        equippedItems[category] = null;
    }

    updateShopDisplay();
    playSound(523, 0.3, "sine", 0.1);
    console.log(`Cancelled purchase of ${itemId}, refunded ${price} gold`);
}

function addGold(amount) {
    gold += amount;
    updateShopDisplay();
}

// Initialize Dragon
function initDragon() {
    dragon.segments = [];
    dragon.customColor = dragonCustomization.color;
    dragon.headSize = dragonCustomization.size;
    dragon.wingFlap = 0;

    for (let i = 0; i < dragon.segmentCount; i++) {
        dragon.segments.push({
            x: mouse.x - i * dragon.segmentLength,
            y: mouse.y,
            size: dragon.headSize * (1 - (i / dragon.segmentCount) * 0.6),
            rotation: 0,
        });
    }
}

// Enhanced Speed Functions
function getDragonSpeed() {
    if (gameMode !== "hunt") return dragon.baseSpeed;
    return 5 + level * 0.075;
}

function getEnemySpeed() {
    if (gameMode !== "hunt") return 2;
    return 1.2 + level * 0.08;
}

function getEnemyHealth() {
    return 30 + level * 8;
}

function getBossHealth() {
    return 200 + level * 40;
}

function getForbiddenZones() {
    const forbiddenZones = [];

    forbiddenZones.push({
        x: 20,
        y: 20,
        width: 250,
        height: 150,
    });
    forbiddenZones.push({
        x: canvas.width - 270,
        y: 20,
        width: 250,
        height: 150,
    });

    forbiddenZones.push({
        x: canvas.width - 120,
        y: 20,
        width: 100,
        height: 60,
    });

    forbiddenZones.push({
        x: canvas.width - 280,
        y: 20,
        width: 100,
        height: 60,
    });

    obstacles.forEach((obs) => {
        forbiddenZones.push({
            x: obs.x - 10,
            y: obs.y - 10,
            width: obs.width + 20,
            height: obs.height + 20,
        });
    });

    return forbiddenZones;
}

function isValidPosition(x, y, size) {
    const forbiddenZones = getForbiddenZones();

    for (const zone of forbiddenZones) {
        if (
            x + size > zone.x &&
            x - size < zone.x + zone.width &&
            y + size > zone.y &&
            y - size < zone.y + zone.height
        ) {
            return false;
        }
    }

    const margin = size + 10;
    if (x < margin || x > canvas.width - margin || y < margin || y > canvas.height - margin) {
        return false;
    }

    return true;
}

function spawnCollectibles(count) {
    const types = [
        { emoji: "🍖", heals: false, unique: false, value: 20 },
        { emoji: "🍎", heals: true, unique: false, value: 15 },
        { emoji: "💎", heals: false, unique: true, value: 100 },
        { emoji: "🥩", heals: false, unique: false, value: 25 },
        { emoji: "🍇", heals: true, unique: false, value: 18 },
        { emoji: "🏺", heals: false, unique: true, value: 150 },
        { emoji: "⚔️", heals: false, unique: true, value: 120 },
        { emoji: "🛡️", heals: false, unique: true, value: 110 },
        { emoji: "👑", heals: false, unique: true, value: 200 },
        { emoji: "💰", heals: false, unique: false, value: 50, gold: 10 },
        { emoji: "💸", heals: false, unique: false, value: 30, gold: 5 },
    ];

    let spawnedCount = 0;
    let attempts = 0;
    const maxAttempts = count * 10;

    while (spawnedCount < count && attempts < maxAttempts) {
        const randomType = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 100) + 50;
        const size = randomType.unique ? 40 : 30;

        if (isValidPosition(x, y, size)) {
            const collectible = {
                x: x,
                y: y,
                type: randomType.emoji,
                heals: randomType.heals,
                unique: randomType.unique,
                size: size,
                collected: false,
                value: randomType.value,
                gold: randomType.gold || 0,
                id: randomType.emoji,
            };

            collectibles.push(collectible);
            spawnedCount++;
        }
        attempts++;
    }

    if (spawnedCount < count) {
        console.log(`Προστέθηκαν μόνο ${spawnedCount} από ${count} collectibles`);
    }
}

// Start Game
function startGame(mode) {
    console.log("STARTING GAME MODE:", mode);

    gameMode = mode;
    gameRunning = true;
    gamePaused = false;
    score = 0;
    level = 1;
    combo = 0;
    gameTime = 0;
    enemiesDefeated = 0;
    itemsCollected = 0;
    skillPoints = 0;

    dragon.health = dragonCustomization.skills.health1 ? 150 : 100;
    dragon.maxHealth = dragonCustomization.skills.health1 ? 150 : 100;
    dragon.fireRate = dragonCustomization.skills.fire2 ?
        3 :
        dragonCustomization.skills.fire1 ?
        1.5 :
        1;
    dragon.speedBoost = dragonCustomization.skills.speed2 ? 1.5 : 1;
    dragon.baseSpeed = dragonCustomization.skills.speed1 ? 6 : 5;
    dragon.hasPowerUp = false;
    dragon.speed = getDragonSpeed();
    dragonLevelUpEffect = 0;

    dragon.customColor = dragonCustomization.color;
    dragon.headSize = dragonCustomization.size;

    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("hud").style.display = "flex";
    document.getElementById("pauseButton").style.display = "block";

    initDragon();
    collectibles = [];
    enemies = [];
    obstacles = [];
    powerUps = [];
    particles = [];
    boss = null;
    environment = [];

    createEnvironment();

    for (let key in achievements) {
        achievements[key].unlocked = false;
    }

    if (mode === "hunt") {
        spawnCollectibles(5);
        spawnEnemies(2);
    } else if (mode === "race") {
        spawnObstacles(8);
        setTimeout(() => {
            spawnCollectibles(10);
        }, 0);
    } else if (mode === "sandbox") {
        dragon.trail = [];
    }

    showLevelDisplay();
    gameLoop();
}

// Show Level Display
function showLevelDisplay() {
    const display = document.getElementById("levelDisplay");
    display.textContent = `LEVEL ${level}`;
    display.style.display = "block";

    if (level >= 10) {
        display.style.color = "#ffd700";
        display.style.textShadow = "0 0 20px #ffd700";
    } else if (level >= 5) {
        display.style.color = "#ff6b6b";
        display.style.textShadow = "0 0 15px #ff6b6b";
    }

    setTimeout(() => (display.style.display = "none"), 2000);
}

// Show Heal Notification
function showHealNotification(amount) {
    const notification = document.getElementById("healNotification");
    notification.textContent = `+${amount} HP! ❤️`;
    notification.style.display = "block";
    setTimeout(() => (notification.style.display = "none"), 1000);
}

// Show Achievement
function showAchievement(achievement) {
    if (achievement.unlocked) return;
    achievement.unlocked = true;
    achievementSound();

    const notification = document.getElementById("achievementNotification");
    notification.innerHTML = `🏆 ${achievement.name}<br><small>${achievement.desc}</small>`;
    notification.style.display = "block";
    setTimeout(() => (notification.style.display = "none"), 3000);
}

// Check Achievements
function checkAchievements() {
    if (enemiesDefeated === 1 && !achievements.firstBlood.unlocked) {
        showAchievement(achievements.firstBlood);
    }
    if (level >= 10 && !achievements.speedDemon.unlocked) {
        showAchievement(achievements.speedDemon);
    }
    if (level >= 20 && !achievements.levelMaster.unlocked) {
        showAchievement(achievements.levelMaster);
    }
    if (dragon.health <= 20 && dragon.health > 0 && !achievements.survivor.unlocked) {
        showAchievement(achievements.survivor);
    }
    if (itemsCollected >= 50 && !achievements.collector.unlocked) {
        showAchievement(achievements.collector);
    }
    if (combo >= 15 && !achievements.comboKing.unlocked) {
        showAchievement(achievements.comboKing);
    }
}

function spawnEnemies(count) {
    const types = ["knight", "dragon"];
    const head = dragon.segments[0];

    for (let i = 0; i < count; i++) {
        let x,
            y,
            attempts = 0,
            tooClose = true;

        while (tooClose && attempts < 20) {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
            const dx = x - head.x;
            const dy = y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 300) tooClose = false;
            attempts++;
        }

        enemies.push({
            x: x,
            y: y,
            type: types[Math.floor(Math.random() * types.length)],
            size: 40,
            health: getEnemyHealth(),
            maxHealth: getEnemyHealth(),
            speed: getEnemySpeed(),
            alive: true,
            spawnTimer: 60,
        });
    }
}

function spawnObstacles(count) {
    for (let i = 0; i < count; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            width: 50 + Math.random() * 50,
            height: 50 + Math.random() * 50,
            type: Math.random() > 0.5 ? "rock" : "spike",
        });
    }
}

function spawnPowerUp() {
    const types = ["speed", "fire", "health", "size"];
    powerUps.push({
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        type: types[Math.floor(Math.random() * types.length)],
        size: 35,
        collected: false,
        duration: 300,
    });
}

function spawnBoss() {
    boss = {
        x: canvas.width / 2,
        y: 100,
        size: 100,
        health: getBossHealth(),
        maxHealth: getBossHealth(),
        phase: 1,
        attackTimer: 0,
        movePattern: 0,
    };
}

// Create Particles
function createParticles(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 60,
            size: Math.random() * 6 + 2,
            color: color,
        });
    }
}

function createSparkles(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 40,
            size: Math.random() * 4 + 1,
            color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`,
        });
    }
}

function createLevelUpParticles(x, y) {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 5,
            life: 90,
            size: Math.random() * 8 + 3,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        });
    }
}

// Screen Shake
function shakeScreen(amount = 10) {
    screenShakeAmount = amount;
}

// Update Dragon
function updateDragon() {
    const head = dragon.segments[0];
    const dx = mouse.x - head.x;
    const dy = mouse.y - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
        const speed = dragon.speed * dragon.speedBoost;
        head.x += (dx / dist) * Math.min(dist, speed);
        head.y += (dy / dist) * Math.min(dist, speed);
    }

    head.rotation = Math.atan2(dy, dx);

    dragon.wingFlap += dragon.wingFlapSpeed;

    for (let i = 1; i < dragon.segments.length; i++) {
        const curr = dragon.segments[i];
        const prev = dragon.segments[i - 1];
        const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const targetX = prev.x + Math.cos(angle) * dragon.segmentLength;
        const targetY = prev.y + Math.sin(angle) * dragon.segmentLength;
        const followSpeed = 0.5;
        curr.x += (targetX - curr.x) * followSpeed;
        curr.y += (targetY - curr.y) * followSpeed;
        curr.rotation = angle;
    }

    if (gameMode === "sandbox") {
        dragon.trail.push({ x: head.x, y: head.y, life: 60 });
        dragon.trail = dragon.trail.filter((t) => t.life-- > 0);
    }

    if (dragon.invulnerable > 0) dragon.invulnerable--;
}

// Βελτιωμένη updateCollectibles function
function updateCollectibles() {
    const head = dragon.segments[0];
    collectibles.forEach((item) => {
        if (!item.collected) {
            const dx = item.x - head.x;
            const dy = item.y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < head.size + item.size) {
                item.collected = true;
                score += item.value * (1 + combo * 0.1);
                itemsCollected++;
                combo++;
                comboTimer = 180;
                collectSound();
                createSparkles(item.x, item.y);
                if (item.gold > 0) {
                    addGold(item.gold);
                    console.log(`Collected ${item.gold} gold from ${item.type}`);
                }

                if (item.unique) {
                    collectedItems.add(item.id);
                    if (collectedItems.size >= 10 && !achievements.treasureHunter.unlocked) {
                        showAchievement(achievements.treasureHunter);
                    }
                }

                if (score > 0 && score % 1000 === 0) {
                    skillPoints++;
                    document.getElementById("skillPoints").textContent = skillPoints;
                }

                if (item.heals && dragon.health < dragon.maxHealth) {
                    const healAmount = 20;
                    dragon.health = Math.min(dragon.maxHealth, dragon.health + healAmount);
                    healSound();
                    showHealNotification(healAmount);
                }

                if (combo > 1) {
                    document.getElementById("comboDisplay").textContent = `${combo}x COMBO!`;
                    document.getElementById("comboDisplay").style.display = "block";

                    if (combo >= 10) {
                        document.getElementById("comboDisplay").style.color = "#ffd700";
                        document.getElementById("comboDisplay").style.textShadow = "0 0 15px #ffd700";
                    } else if (combo >= 5) {
                        document.getElementById("comboDisplay").style.color = "#ff6b6b";
                        document.getElementById("comboDisplay").style.textShadow = "0 0 10px #ff6b6b";
                    }

                    setTimeout(() => (document.getElementById("comboDisplay").style.display = "none"), 1000);

                    if (combo >= 15 && !achievements.comboKing.unlocked) {
                        showAchievement(achievements.comboKing);
                    }
                }

                checkAchievements();
            }
        }
    });

    collectibles = collectibles.filter((item) => !item.collected);
    if (collectibles.length < 3 && gameMode === "hunt") spawnCollectibles(2);
}

// Update Enemies
function updateEnemies() {
    const head = dragon.segments[0];

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        if (enemy.spawnTimer > 0) {
            enemy.spawnTimer--;
            return;
        }

        const dx = head.x - enemy.x;
        const dy = head.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 50) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        if (dist < head.size + enemy.size && dragon.invulnerable === 0) {
            dragon.health -= 10;
            dragon.invulnerable = 60;
            hitSound();
            shakeScreen(8);
            if (dragon.health <= 0) gameOver();
            checkAchievements();
        }

        fireParticles.forEach((fire) => {
            const fdx = fire.x - enemy.x;
            const fdy = fire.y - enemy.y;
            const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
            if (fdist < enemy.size) {
                enemy.health -= 2 * dragon.fireRate;
                if (enemy.health <= 0) {
                    enemy.alive = false;
                    score += 100;
                    enemiesDefeated++;
                    enemyDefeatSound();
                    createParticles(enemy.x, enemy.y, "#8a2be2", 25);
                    checkAchievements();
                }
            }
        });
    });

    enemies = enemies.filter((e) => e.alive);
    if (enemies.length < 2 && gameMode === "hunt" && !boss) {
        spawnEnemies(1 + Math.floor(level / 3));
    }
}

// Update Boss
function updateBoss() {
    if (!boss) return;

    const head = dragon.segments[0];
    boss.attackTimer++;
    boss.movePattern += 0.02;
    boss.x = canvas.width / 2 + Math.sin(boss.movePattern) * 200;
    boss.y = 150 + Math.cos(boss.movePattern * 2) * 50;

    if (boss.attackTimer % 120 === 0) spawnEnemies(2);

    const dx = boss.x - head.x;
    const dy = boss.y - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < boss.size + head.size && dragon.invulnerable === 0) {
        dragon.health -= 15;
        dragon.invulnerable = 60;
        hitSound();
        shakeScreen(12);
        if (dragon.health <= 0) gameOver();
    }

    fireParticles.forEach((fire) => {
        const fdx = fire.x - boss.x;
        const fdy = fire.y - boss.y;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
        if (fdist < boss.size) boss.health -= 1 * dragon.fireRate;
    });

    if (boss.health <= 0) {
        score += 1000;
        bossDefeatSound();
        createParticles(boss.x, boss.y, "#ff00ff", 50);

        setTimeout(() => {
            levelUp();
            boss = null;
        }, 500);

        if (!achievements.bossSlayer.unlocked) {
            showAchievement(achievements.bossSlayer);
        }
        shakeScreen(20);
    }
}

// Update Obstacles
function updateObstacles() {
    const head = dragon.segments[0];
    obstacles.forEach((obs) => {
        const dx = Math.abs(obs.x + obs.width / 2 - head.x);
        const dy = Math.abs(obs.y + obs.height / 2 - head.y);

        if (dx < obs.width / 2 + head.size && dy < obs.height / 2 + head.size) {
            if (dragon.invulnerable === 0) {
                dragon.health -= 15;
                dragon.invulnerable = 60;
                hitSound();
                shakeScreen(8);
                if (dragon.health <= 0) gameOver();
            }
        }
    });
}

// Update Power-ups
function updatePowerUps() {
    const head = dragon.segments[0];
    powerUps.forEach((powerUp) => {
        if (!powerUp.collected) {
            const dx = powerUp.x - head.x;
            const dy = powerUp.y - head.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < head.size + powerUp.size) {
                powerUp.collected = true;
                powerUpSound();
                dragon.hasPowerUp = true;

                if (powerUp.type === "speed") dragon.speedBoost = 2;
                else if (powerUp.type === "fire") dragon.fireRate = 3;
                else if (powerUp.type === "health")
                    dragon.health = Math.min(dragon.maxHealth, dragon.health + 30);
                else if (powerUp.type === "size") dragon.headSize = 50;

                setTimeout(() => {
                    if (powerUp.type === "speed") dragon.speedBoost = 1;
                    else if (powerUp.type === "fire") dragon.fireRate = 1;
                    else if (powerUp.type === "size") dragon.headSize = 35;
                    dragon.hasPowerUp = false;
                }, powerUp.duration * 30);
            }
        }
    });

    powerUps = powerUps.filter((p) => !p.collected);
}

function updateParticles() {
    // ΒΕΛΤΙΩΜΕΝΟ - Πιο αυστηρό όριο particles
    if (particles.length > 100) {
        particles = particles.slice(50);
    }

    particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        p.size *= 0.96;
    });
    particles = particles.filter((p) => p.life > 0);
}

// Update Fire
function updateFire() {
    // ΒΕΛΤΙΩΜΕΝΟ - Καθαρισμός παλιών fire particles
    if (fireParticles.length > 150) {
        fireParticles = fireParticles.slice(75);
    }

    fireParticles.forEach((fire) => {
        fire.x += fire.vx;
        fire.y += fire.vy;
        fire.life--;
        fire.size *= 0.97;
    });
    fireParticles = fireParticles.filter((f) => f.life > 0);
}

// Breathe Fire
function breatheFire() {
    const head = dragon.segments[0];
    const count = 10 * dragon.fireRate;
    fireSound();

    for (let i = 0; i < count; i++) {
        fireParticles.push({
            x: head.x,
            y: head.y,
            vx: Math.cos(head.rotation) * (8 + Math.random() * 4),
            vy: Math.sin(head.rotation) * (8 + Math.random() * 4),
            life: 40,
            size: 8 + Math.random() * 8,
            color: `hsl(${Math.random() * 60}, 100%, 50%)`,
        });
    }
}

// Level Up System
function levelUp() {
    const oldLevel = level;
    level = oldLevel + 1;

    console.log("Level up! New level:", level, "Enemy speed:", getEnemySpeed());

    dragonLevelUpEffect = 180;
    levelUpSound();

    const head = dragon.segments[0];
    createLevelUpParticles(head.x, head.y);

    showLevelDisplay();

    dragon.health = Math.min(dragon.maxHealth, dragon.health + 20);
    dragon.speed = getDragonSpeed();

    if (gameMode === "hunt") {
        collectibles = [];
        enemies = [];

        const enemyCount = 2 + Math.floor(level / 2);
        const collectibleCount = 5 + level;

        spawnCollectibles(collectibleCount);
        spawnEnemies(enemyCount);

        if (level % 5 === 0 && !boss) {
            spawnBoss();
            console.log("BOSS SPAWNED at level:", level);
        }
        if (Math.random() < 0.5) spawnPowerUp();
    } else if (gameMode === "race") {
        obstacles = [];
        collectibles = [];

        const obstacleCount = 8 + level;
        const collectibleCount = 10 + level;

        spawnObstacles(obstacleCount);
        setTimeout(() => {
            spawnCollectibles(collectibleCount);
        }, 0);
    }

    checkAchievements();
}

// Dragon Customization Functions
function updateDragonCustomization() {
    dragonCustomization.color = document.getElementById("dragonColor").value;
    dragonCustomization.size = parseInt(document.getElementById("dragonSize").value);

    console.log("Dragon customization updated:", dragonCustomization);

    if (gameRunning) {
        dragon.customColor = dragonCustomization.color;
        dragon.headSize = dragonCustomization.size;

        dragon.segments.forEach((segment, i) => {
            segment.size = dragon.headSize * (1 - (i / dragon.segmentCount) * 0.6);
        });
    }

    if (!achievements.dragonArtist.unlocked) {
        let customizations = 0;
        if (dragonCustomization.color !== "#ff6b6b") customizations++;
        if (dragonCustomization.size !== 35) customizations++;

        if (customizations >= 2) {
            showAchievement(achievements.dragonArtist);
        }
    }
}

// Skill Tree Functions
function showSkillTree() {
    console.log("Opening skill tree");
    document.getElementById("skillTreeMenu").style.display = "block";
    updateSkillTreeDisplay();
}

function closeSkillTree() {
    console.log("Closing skill tree");
    document.getElementById("skillTreeMenu").style.display = "none";
}

function updateSkillTreeDisplay() {
    const skills = document.querySelectorAll(".skill");
    skills.forEach((skill) => {
        const skillId = skill.dataset.skill;
        if (dragonCustomization.skills[skillId]) {
            skill.classList.add("purchased");
            skill.style.opacity = "0.7";
            skill.innerHTML = `<span>${skill.querySelector("span").textContent} ✓</span><span class="skill-cost">Αγορασμένο</span>`;
        } else {
            skill.classList.remove("purchased");
            skill.style.opacity = "1";
            const skillName =
                skill.dataset.skill === "fire1" ?
                "Fire Rate +" :
                skill.dataset.skill === "fire2" ?
                "Double Fire" :
                skill.dataset.skill === "speed1" ?
                "Speed +" :
                skill.dataset.skill === "speed2" ?
                "Dash" :
                skill.dataset.skill === "health1" ?
                "Max Health +" :
                "Regeneration";
            const cost =
                skill.dataset.skill === "fire1" ||
                skill.dataset.skill === "speed1" ||
                skill.dataset.skill === "health1" ?
                "1 SP" :
                "2 SP";
            skill.innerHTML = `<span>${skillName}</span><span class="skill-cost">${cost}</span>`;
        }
    });
}

function purchaseSkill(skillId) {
    console.log("Attempting to purchase skill:", skillId);

    if (dragonCustomization.skills[skillId]) {
        console.log("Skill already purchased");
        return;
    }

    const cost = skillId === "fire1" || skillId === "speed1" || skillId === "health1" ? 1 : 2;

    if (skillPoints >= cost) {
        skillPoints -= cost;
        dragonCustomization.skills[skillId] = true;
        document.getElementById("skillPoints").textContent = skillPoints;
        updateSkillTreeDisplay();

        if (skillId === "fire1") {
            dragon.fireRate = 1.5;
        } else if (skillId === "fire2") {
            dragon.fireRate = 3;
        } else if (skillId === "speed1") {
            dragon.baseSpeed = 6;
            dragon.speed = getDragonSpeed();
        } else if (skillId === "speed2") {
            dragon.speedBoost = 1.5;
        } else if (skillId === "health1") {
            dragon.maxHealth = 150;
            dragon.health = Math.min(dragon.health, dragon.maxHealth);
        } else if (skillId === "health2") {
            // Health regeneration handled in game loop
        }

        console.log("Skill purchased:", skillId);
        playSound(784, 0.3, "sine", 0.1);

        let purchasedSkills = 0;
        for (let skill in dragonCustomization.skills) {
            if (dragonCustomization.skills[skill]) purchasedSkills++;
        }
        if (purchasedSkills >= 6 && !achievements.skillMaster.unlocked) {
            showAchievement(achievements.skillMaster);
        }
    } else {
        console.log("Not enough skill points");
        playSound(220, 0.2, "sine", 0.05);
    }
}

// Create Environment
function createEnvironment() {
    environment = [];
    const count = 20;

    for (let i = 0; i < count; i++) {
        environment.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            type: Math.random() > 0.5 ? "tree" : "rock",
            size: 20 + Math.random() * 30,
        });
    }
}

// Game Over
function gameOver() {
    gameRunning = false;
    document.getElementById("gameOverScreen").classList.add("show");
    document.getElementById("pauseButton").style.display = "none";

    document.getElementById("finalScore").textContent = Math.floor(score);
    document.getElementById("finalLevel").textContent = level;
    document.getElementById("finalEnemies").textContent = enemiesDefeated;
    document.getElementById("finalItems").textContent = itemsCollected;
    document.getElementById("finalGold").textContent = gold;

    const unlockedAchievements = Object.values(achievements).filter((a) => a.unlocked).length;
    document.getElementById("finalAchievements").textContent = `${unlockedAchievements}/9`;

    updateLeaderboard();
}

// Update Leaderboard
function updateLeaderboard() {
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = "";

    let scores = JSON.parse(localStorage.getItem("dragonGameScores")) || [];

    scores.push({
        score: Math.floor(score),
        level: level,
        date: new Date().toLocaleDateString("el-GR"),
    });

    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);

    localStorage.setItem("dragonGameScores", JSON.stringify(scores));

    scores.forEach((entry, index) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "leaderboard-entry";
        if (entry.score === Math.floor(score) && index === 0) {
            entryDiv.classList.add("current");
        }
        entryDiv.innerHTML = `
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-score">${entry.score} (Level ${entry.level})</span>
        `;
        leaderboardList.appendChild(entryDiv);
    });
}

// Pause Game
function pauseGame() {
    if (!gameRunning) return;
    gamePaused = true;
    document.getElementById("pauseMenu").classList.add("show");
    updatePauseButton();
}

// Resume Game
function resumeGame() {
    gamePaused = false;
    document.getElementById("pauseMenu").classList.remove("show");
    updatePauseButton();
}

// Restart Game
function restartGame() {
    document.getElementById("gameOverScreen").classList.remove("show");
    document.getElementById("pauseMenu").classList.remove("show");
    startGame(gameMode);
}

// Back to Menu
function backToMenu() {
    gameRunning = false;
    gamePaused = false;
    document.getElementById("gameOverScreen").classList.remove("show");
    document.getElementById("pauseMenu").classList.remove("show");
    document.getElementById("hud").style.display = "none";
    document.getElementById("pauseButton").style.display = "none";
    document.getElementById("startScreen").classList.remove("hidden");
}

// Update HUD
function updateHUD() {
    document.getElementById("scoreDisplay").textContent = Math.floor(score);
    document.getElementById("levelNum").textContent = level;
    document.getElementById("healthBar").style.width = `${(dragon.health / dragon.maxHealth) * 100}%`;
    document.getElementById("fireRate").textContent = `${dragon.fireRate}x`;
    document.getElementById("speedBoost").textContent = `${dragon.speedBoost}x`;
    document.getElementById("skillPoints").textContent = skillPoints;
    document.getElementById("goldDisplay").textContent = gold;

    const minutes = Math.floor(gameTime / 3600);
    const seconds = Math.floor((gameTime % 3600) / 60);
    document.getElementById("timeDisplay").textContent =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (comboTimer > 0) comboTimer--;
    else if (combo > 0) combo = 0;
}

// Draw Functions
function drawBackground() {
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 217.3) % canvas.height;
        const size = (i % 3) + 1;
        const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fillRect(x, y, size, size);
    }
}

function drawEnvironment() {
    environment.forEach((env) => {
        ctx.fillStyle = env.type === "tree" ? "#2d5a27" : "#666";
        ctx.fillRect(env.x, env.y, env.size, env.size);
    });
}

// ✅ ENHANCED DRAGON WITH WINGS, HORNS AND ACCESSORIES - COMPLETE!
function drawDragon() {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (gameMode === "sandbox" && dragon.trail.length > 0) {
        for (let i = 0; i < dragon.trail.length - 1; i++) {
            const t = dragon.trail[i];
            const alpha = t.life / 60;
            ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(dragon.trail[i + 1].x, dragon.trail[i + 1].y);
            ctx.stroke();
        }
    }

    dragon.segments.forEach((segment, index) => {
        const isHead = index === 0;

        // DRAW WINGS on segment 2
        if (index === 2) {
            const wingFlap = Math.sin(dragon.wingFlap) * 0.3;
            const wingLength = segment.size * 3;
            const wingWidth = segment.size * 2;

            // Get wing skin colors
            let wingColor1 = dragon.customColor || "#ff6b6b";
            let wingColor2 = `${dragon.customColor || "#ff6b6b"}DD`;
            let wingColor3 = `${dragon.customColor || "#8b0000"}BB`;
            let wingColor4 = `${dragon.customColor || "#5a0000"}99`;
            let glowEffect = false;

            if (equippedItems.wings === "fire_wings") {
                wingColor1 = "#ff4500";
                wingColor2 = "#ff6347DD";
                wingColor3 = "#ff0000BB";
                wingColor4 = "#8b000099";
                glowEffect = true;
            } else if (equippedItems.wings === "crystal_wings") {
                wingColor1 = "#00ffff";
                wingColor2 = "#87ceebDD";
                wingColor3 = "#4169e1BB";
                wingColor4 = "#19197099";
                glowEffect = true;
            } else if (equippedItems.wings === "shadow_wings") {
                wingColor1 = "#2d2d2d";
                wingColor2 = "#1a1a1aDD";
                wingColor3 = "#000000BB";
                wingColor4 = "#00000099";
            }

            // ΑΡΙΣΤΕΡΟ ΦΤΕΡΟ
            ctx.save();
            ctx.translate(segment.x, segment.y);

            const leftAngle = segment.rotation - Math.PI / 2;
            ctx.translate(
                Math.cos(leftAngle) * segment.size * 0.5,
                Math.sin(leftAngle) * segment.size * 0.5
            );

            ctx.rotate(segment.rotation + wingFlap);

            if (glowEffect) {
                ctx.shadowBlur = 25;
                ctx.shadowColor = wingColor1;
            } else {
                ctx.shadowBlur = 20;
                ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            }

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                wingWidth * 0.5,
                wingLength * 0.2,
                wingWidth * 0.8,
                wingLength * 0.5,
                wingWidth * 0.7,
                wingLength * 0.85
            );
            ctx.lineTo(wingWidth * 0.5, wingLength);
            ctx.lineTo(wingWidth * 0.3, wingLength * 0.9);
            ctx.bezierCurveTo(wingWidth * 0.2, wingLength * 0.7, wingWidth * 0.1, wingLength * 0.4, 0, 0);
            ctx.closePath();

            const wingGradient = ctx.createLinearGradient(0, 0, wingWidth * 0.6, wingLength);
            wingGradient.addColorStop(0, wingColor1);
            wingGradient.addColorStop(0.4, wingColor2);
            wingGradient.addColorStop(0.8, wingColor3);
            wingGradient.addColorStop(1, wingColor4);

            ctx.fillStyle = wingGradient;
            ctx.fill();

            ctx.strokeStyle = equippedItems.wings === "shadow_wings" ? "#000" : "#5a0000";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.lineWidth = 1;
            ctx.strokeStyle = equippedItems.wings === "shadow_wings" ? "#333" : "#8b0000";
            ctx.globalAlpha = 0.7;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(wingWidth * 0.35, wingLength * 0.7);
            ctx.moveTo(0, 0);
            ctx.lineTo(wingWidth * 0.55, wingLength * 0.8);
            ctx.moveTo(0, 0);
            ctx.lineTo(wingWidth * 0.25, wingLength * 0.5);
            ctx.moveTo(wingWidth * 0.15, wingLength * 0.3);
            ctx.lineTo(wingWidth * 0.4, wingLength * 0.6);
            ctx.moveTo(wingWidth * 0.25, wingLength * 0.5);
            ctx.lineTo(wingWidth * 0.45, wingLength * 0.75);
            ctx.moveTo(wingWidth * 0.35, wingLength * 0.7);
            ctx.lineTo(wingWidth * 0.6, wingLength * 0.9);
            ctx.stroke();

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();

            // ΔΕΞΙ ΦΤΕΡΟ
            ctx.save();
            ctx.translate(segment.x, segment.y);

            const rightAngle = segment.rotation + Math.PI / 2;
            ctx.translate(
                Math.cos(rightAngle) * segment.size * 0.5,
                Math.sin(rightAngle) * segment.size * 0.5
            );

            ctx.rotate(segment.rotation + Math.PI - wingFlap);

            if (glowEffect) {
                ctx.shadowBlur = 25;
                ctx.shadowColor = wingColor1;
            } else {
                ctx.shadowBlur = 20;
                ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            }

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-wingWidth * 0.5,
                wingLength * 0.2, -wingWidth * 0.8,
                wingLength * 0.5, -wingWidth * 0.7,
                wingLength * 0.85
            );
            ctx.lineTo(-wingWidth * 0.5, wingLength);
            ctx.lineTo(-wingWidth * 0.3, wingLength * 0.9);
            ctx.bezierCurveTo(-wingWidth * 0.2,
                wingLength * 0.7, -wingWidth * 0.1,
                wingLength * 0.4,
                0,
                0
            );
            ctx.closePath();

            const wingGradient2 = ctx.createLinearGradient(0, 0, -wingWidth * 0.6, wingLength);
            wingGradient2.addColorStop(0, wingColor1);
            wingGradient2.addColorStop(0.4, wingColor2);
            wingGradient2.addColorStop(0.8, wingColor3);
            wingGradient2.addColorStop(1, wingColor4);

            ctx.fillStyle = wingGradient2;
            ctx.fill();

            ctx.strokeStyle = equippedItems.wings === "shadow_wings" ? "#000" : "#5a0000";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.lineWidth = 1;
            ctx.strokeStyle = equippedItems.wings === "shadow_wings" ? "#333" : "#8b0000";
            ctx.globalAlpha = 0.7;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-wingWidth * 0.35, wingLength * 0.7);
            ctx.moveTo(0, 0);
            ctx.lineTo(-wingWidth * 0.55, wingLength * 0.8);
            ctx.moveTo(0, 0);
            ctx.lineTo(-wingWidth * 0.25, wingLength * 0.5);
            ctx.moveTo(-wingWidth * 0.15, wingLength * 0.3);
            ctx.lineTo(-wingWidth * 0.4, wingLength * 0.6);
            ctx.moveTo(-wingWidth * 0.25, wingLength * 0.5);
            ctx.lineTo(-wingWidth * 0.45, wingLength * 0.75);
            ctx.moveTo(-wingWidth * 0.35, wingLength * 0.7);
            ctx.lineTo(-wingWidth * 0.6, wingLength * 0.9);
            ctx.stroke();

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Dragon body segment
        ctx.fillStyle = dragon.customColor || "#ff6b6b";
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segment.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Scale texture on body
        if (index > 0 && index % 2 === 0) {
            ctx.fillStyle = `${dragon.customColor || "#ff6b6b"}88`;
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, segment.size / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw head details
        if (isHead) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ffff00";

            let eyeColor = level >= 8 ? "#00ffff" : "#ffff00";

            ctx.fillStyle = eyeColor;

            const eyeOffset = segment.size / 3;
            const eyeSize = segment.size / 8;
            const eye1X = segment.x + Math.cos(segment.rotation - 0.4) * eyeOffset;
            const eye1Y = segment.y + Math.sin(segment.rotation - 0.4) * eyeOffset;
            const eye2X = segment.x + Math.cos(segment.rotation + 0.4) * eyeOffset;
            const eye2Y = segment.y + Math.sin(segment.rotation + 0.4) * eyeOffset;

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = "#000000";
            const pupilOffset = eyeSize * 0.3;
            ctx.beginPath();
            ctx.arc(eye1X + pupilOffset, eye1Y, eyeSize * 0.4, 0, Math.PI * 2);
            ctx.arc(eye2X + pupilOffset, eye2Y, eyeSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;

            // ✅ DRAW HORNS - ΝΕΟ!
            ctx.save();
            ctx.translate(segment.x, segment.y);
            ctx.rotate(segment.rotation);

            // Default horns or equipped horns
            if (equippedItems.horns === "demon_horns") {
                // Demon Horns - Κόκκινα με μαύρες άκρες
                ctx.fillStyle = "#8b0000";
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;

                // Αριστερό κέρατο
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, -segment.size / 2);
                ctx.quadraticCurveTo(
                    segment.size / 2.5, -segment.size * 1.4,
                    segment.size / 2, -segment.size * 1.5
                );
                ctx.lineTo(segment.size / 3.5, -segment.size * 1.3);
                ctx.quadraticCurveTo(
                    segment.size / 3, -segment.size * 1.1,
                    segment.size / 5, -segment.size / 2.5
                );
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Tip effect
                ctx.fillStyle = "#000";
                ctx.beginPath();
                ctx.arc(segment.size / 2, -segment.size * 1.5, 3, 0, Math.PI * 2);
                ctx.fill();

                // Δεξί κέρατο
                ctx.fillStyle = "#8b0000";
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, segment.size / 2);
                ctx.quadraticCurveTo(
                    segment.size / 2.5,
                    segment.size * 1.4,
                    segment.size / 2,
                    segment.size * 1.5
                );
                ctx.lineTo(segment.size / 3.5, segment.size * 1.3);
                ctx.quadraticCurveTo(
                    segment.size / 3,
                    segment.size * 1.1,
                    segment.size / 5,
                    segment.size / 2.5
                );
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#000";
                ctx.beginPath();
                ctx.arc(segment.size / 2, segment.size * 1.5, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (equippedItems.horns === "golden_horns") {
                // Golden Horns - Χρυσά λαμπερά
                const goldGradient = ctx.createLinearGradient(0, -segment.size * 1.5, 0, -segment.size / 2);
                goldGradient.addColorStop(0, "#ffd700");
                goldGradient.addColorStop(0.5, "#ffed4e");
                goldGradient.addColorStop(1, "#daa520");

                ctx.fillStyle = goldGradient;
                ctx.strokeStyle = "#b8860b";
                ctx.lineWidth = 2;
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#ffd700";

                // Αριστερό κέρατο
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, -segment.size / 2);
                ctx.bezierCurveTo(
                    segment.size / 3, -segment.size * 0.9,
                    segment.size / 2.5, -segment.size * 1.3,
                    segment.size / 2.5, -segment.size * 1.6
                );
                ctx.lineTo(segment.size / 3.5, -segment.size * 1.4);
                ctx.bezierCurveTo(
                    segment.size / 3.5, -segment.size * 1.1,
                    segment.size / 3, -segment.size * 0.8,
                    segment.size / 5, -segment.size / 2.5
                );
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Δεξί κέρατο
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, segment.size / 2);
                ctx.bezierCurveTo(
                    segment.size / 3,
                    segment.size * 0.9,
                    segment.size / 2.5,
                    segment.size * 1.3,
                    segment.size / 2.5,
                    segment.size * 1.6
                );
                ctx.lineTo(segment.size / 3.5, segment.size * 1.4);
                ctx.bezierCurveTo(
                    segment.size / 3.5,
                    segment.size * 1.1,
                    segment.size / 3,
                    segment.size * 0.8,
                    segment.size / 5,
                    segment.size / 2.5
                );
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.shadowBlur = 0;
            } else if (equippedItems.horns === "ice_horns") {
                // Ice Horns - Παγωμένα γαλάζια
                const iceGradient = ctx.createLinearGradient(0, -segment.size * 1.5, 0, -segment.size / 2);
                iceGradient.addColorStop(0, "#b0e0e6");
                iceGradient.addColorStop(0.5, "#87ceeb");
                iceGradient.addColorStop(1, "#4682b4");

                ctx.fillStyle = iceGradient;
                ctx.strokeStyle = "#1e90ff";
                ctx.lineWidth = 2;
                ctx.shadowBlur = 20;
                ctx.shadowColor = "#00ffff";

                // Αριστερό κέρατο - οξύ και κρυστάλλινο
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, -segment.size / 2);
                ctx.lineTo(segment.size / 2.8, -segment.size * 1.5);
                ctx.lineTo(segment.size / 3.5, -segment.size * 1.3);
                ctx.lineTo(segment.size / 5, -segment.size / 2.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Ice crystals effect
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.beginPath();
                ctx.arc(segment.size / 3, -segment.size * 1.2, 2, 0, Math.PI * 2);
                ctx.arc(segment.size / 3.5, -segment.size * 0.9, 2, 0, Math.PI * 2);
                ctx.fill();

                // Δεξί κέρατο
                ctx.fillStyle = iceGradient;
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, segment.size / 2);
                ctx.lineTo(segment.size / 2.8, segment.size * 1.5);
                ctx.lineTo(segment.size / 3.5, segment.size * 1.3);
                ctx.lineTo(segment.size / 5, segment.size / 2.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.beginPath();
                ctx.arc(segment.size / 3, segment.size * 1.2, 2, 0, Math.PI * 2);
                ctx.arc(segment.size / 3.5, segment.size * 0.9, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
            } else {
                // Default horns
                ctx.fillStyle = "#8b0000";
                ctx.beginPath();
                ctx.moveTo(segment.size / 4, -segment.size / 2);
                ctx.lineTo(segment.size / 3, -segment.size * 1.2);
                ctx.lineTo(segment.size / 5, -segment.size / 2.5);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(segment.size / 4, segment.size / 2);
                ctx.lineTo(segment.size / 3, segment.size * 1.2);
                ctx.lineTo(segment.size / 5, segment.size / 2.5);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();

            // ✅ DRAW GLASSES - ΣΩΣΤΑ ΤΟΠΟΘΕΤΗΜΕΝΑ!
            ctx.save();
            ctx.translate(segment.x, segment.y);
            ctx.rotate(segment.rotation);

            if (equippedItems.glasses) {
                const headSize = segment.size;
                const glassesOffset = headSize * 0.3;

                if (equippedItems.glasses === "sunglasses") {
                    ctx.fillStyle = "#1a1a1a";
                    ctx.fillRect(glassesOffset - headSize / 6, -headSize / 6, headSize / 3.5, headSize / 5);
                    ctx.fillRect(glassesOffset - headSize / 6, headSize / 20, headSize / 3.5, headSize / 5);

                    ctx.strokeStyle = "#2d2d2d";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(glassesOffset - headSize / 6, -headSize / 20);
                    ctx.lineTo(glassesOffset - headSize / 6, headSize / 20);
                    ctx.stroke();
                } else if (equippedItems.glasses === "nerd_glasses") {
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 3;
                    ctx.fillStyle = "rgba(200, 220, 255, 0.2)";

                    ctx.beginPath();
                    ctx.arc(glassesOffset, -headSize / 8, headSize / 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(glassesOffset, headSize / 8, headSize / 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(glassesOffset, -headSize / 8 + headSize / 5);
                    ctx.lineTo(glassesOffset, headSize / 8 - headSize / 5);
                    ctx.stroke();
                } else if (equippedItems.glasses === "vr_glasses") {
                    ctx.fillStyle = "#0066ff";
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = "#00ccff";

                    ctx.fillRect(
                        glassesOffset - headSize / 8, -headSize / 3,
                        headSize / 2.5,
                        headSize * 0.65
                    );

                    ctx.fillStyle = "#00ccff";
                    ctx.fillRect(glassesOffset - headSize / 12, -headSize / 6, headSize / 8, headSize / 8);
                    ctx.fillRect(glassesOffset - headSize / 12, headSize / 20, headSize / 8, headSize / 8);

                    ctx.shadowBlur = 0;
                }
            }

            ctx.restore();
        }

        ctx.globalAlpha = 1;
    });

    // Level-up particle effect
    if (dragonLevelUpEffect > 0 && dragonLevelUpEffect % 10 === 0) {
        const head = dragon.segments[0];
        createSparkles(head.x, head.y, 5);
    }
}

function drawCollectibles() {
    collectibles.forEach((item) => {
        ctx.font = `${item.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const float = Math.sin(Date.now() / 200 + item.x) * 5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.heals ? "#00ff00" : "#ffd93d";
        ctx.fillText(item.type, item.x, item.y + float);
        ctx.shadowBlur = 0;
    });
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        if (enemy.spawnTimer > 0) {
            ctx.globalAlpha = 0.3 + ((60 - enemy.spawnTimer) / 60) * 0.7;
        }

        if (enemy.type === "knight") {
            ctx.fillStyle = "#666";
            ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
            ctx.fillStyle = "#999";
            ctx.fillRect(
                enemy.x - enemy.size / 3,
                enemy.y - enemy.size / 3,
                enemy.size * 0.6,
                enemy.size * 0.6
            );
        } else {
            ctx.fillStyle = "#8a2be2";
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        const barWidth = enemy.size;
        const barHeight = 5;
        const healthPercent = enemy.health / enemy.maxHealth;

        ctx.fillStyle = "#333";
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size, barWidth, barHeight);
        ctx.fillStyle = healthPercent > 0.5 ? "#0f0" : healthPercent > 0.25 ? "#ff0" : "#f00";
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size, barWidth * healthPercent, barHeight);
    });
}

function drawBoss() {
    if (!boss) return;

    const healthPercent = boss.health / boss.maxHealth;
    let bossColor = "#8a2be2";
    if (healthPercent < 0.5) bossColor = "#ff1493";
    if (healthPercent < 0.25) bossColor = "#ff0000";

    ctx.shadowBlur = 40;
    ctx.shadowColor = bossColor;
    ctx.fillStyle = bossColor;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(boss.x - 20, boss.y - 10, 10, 0, Math.PI * 2);
    ctx.arc(boss.x + 20, boss.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    const barWidth = 200;
    const barHeight = 20;

    ctx.fillStyle = "#333";
    ctx.fillRect(canvas.width / 2 - barWidth / 2, 30, barWidth, barHeight);
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(canvas.width / 2 - barWidth / 2, 30, barWidth * healthPercent, barHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`BOSS: ${Math.floor(boss.health)}/${boss.maxHealth}`, canvas.width / 2, 42);
}

function drawObstacles() {
    obstacles.forEach((obs) => {
        if (obs.type === "rock") {
            ctx.fillStyle = "#555";
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = "#777";
            ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
        } else {
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = i % 2 === 0 ? obs.width / 2 : obs.width / 4;
                const x = obs.x + obs.width / 2 + Math.cos(angle) * radius;
                const y = obs.y + obs.height / 2 + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }
    });
}

function drawPowerUps() {
    powerUps.forEach((powerUp) => {
        const icons = {
            speed: "⚡",
            fire: "🔥",
            health: "❤️",
            size: "⭐",
        };
        ctx.font = `${powerUp.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const float = Math.sin(Date.now() / 150 + powerUp.x) * 8;
        const rotate = Math.sin(Date.now() / 300) * 0.2;

        ctx.save();
        ctx.translate(powerUp.x, powerUp.y + float);
        ctx.rotate(rotate);
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ffd93d";
        ctx.fillText(icons[powerUp.type], 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
    });
}

function drawFire() {
    fireParticles.forEach((fire) => {
        const alpha = fire.life / 40;
        ctx.shadowBlur = 15;
        ctx.shadowColor = fire.color;
        ctx.fillStyle = fire.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    });
}

function drawParticles() {
    particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 60;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

// ΒΕΛΤΙΩΜΕΝΟ Game Loop
function gameLoop() {
    if (!gameRunning) return;

    if (!gamePaused) {
        let shakeX = 0,
            shakeY = 0;
        if (screenShakeAmount > 0) {
            shakeX = (Math.random() - 0.5) * screenShakeAmount;
            shakeY = (Math.random() - 0.5) * screenShakeAmount;
            screenShakeAmount--;
        }

        ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
        ctx.fillStyle = "rgba(10, 17, 40, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawBackground();
        drawEnvironment();

        updateDragon();
        updateFire();
        updateParticles();

        if (
            dragonCustomization.skills.health2 &&
            dragon.health < dragon.maxHealth &&
            gameTime % 60 === 0
        ) {
            dragon.health = Math.min(dragon.maxHealth, dragon.health + 1);
        }

        if (gameMode === "hunt") {
            updateCollectibles();
            updateEnemies();
            updatePowerUps();
            updateBoss();

            const requiredScore = level * 500;
            if (score >= requiredScore && !boss) {
                levelUp();
            }
        } else if (gameMode === "race") {
            updateCollectibles();
            updateObstacles();

            if (collectibles.length === 0) {
                levelUp();
            }
        }

        drawDragon();
        drawFire();
        drawParticles();
        drawCollectibles();

        if (gameMode === "hunt") {
            drawEnemies();
            drawPowerUps();
            drawBoss();
        } else if (gameMode === "race") {
            drawObstacles();
        }

        updateHUD();
        gameTime++;

        if (dragonLevelUpEffect > 0) dragonLevelUpEffect--;

        if (Math.random() < 0.001 && powerUps.length < 2) spawnPowerUp();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    requestAnimationFrame(gameLoop);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded - setting up event listeners");

    const modeCards = document.querySelectorAll(".mode-card");
    modeCards.forEach((card) => {
        card.addEventListener("click", function() {
            const mode = this.getAttribute("data-mode");
            console.log("Mode clicked:", mode);
            startGame(mode);
        });
    });

    document.getElementById("dragonColor").addEventListener("input", updateDragonCustomization);
    document.getElementById("dragonSize").addEventListener("input", updateDragonCustomization);

    updateDragonCustomization();
    updateShopDisplay();

    document.getElementById("startScreen").addEventListener("click", (e) => {
        if (audioCtx.state === "suspended") audioCtx.resume();
    });
});

canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("click", (e) => {
    if (gameRunning && !gamePaused) breatheFire();
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

canvas.addEventListener("touchstart", (e) => {
    if (gameRunning && !gamePaused) breatheFire();
});

// ΒΕΛΤΙΩΜΕΝΟ ESC KEY
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (gameRunning) {
            togglePause();
        }
    }
    if (e.key === " " && gameRunning && !gamePaused) {
        e.preventDefault();
        breatheFire();
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

console.log("🐉 Enhanced Dragon Game with Horns & Wing Skins loaded successfully! 🦴🦋");