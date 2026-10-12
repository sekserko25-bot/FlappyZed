// Persistent BUY inventory and run-based power-up use.
const SHOP_KEY = 'zed_powerup_inventory_v1';
let shopInventory = { lives: 0, shields: 0, magnets: 0 };
let runUsage = { lives: 0, shields: 0, magnets: 0 };
let runMagnetActive = false;
let runIsActive = false;

try {
    shopInventory = { ...shopInventory, ...JSON.parse(localStorage.getItem(SHOP_KEY) || '{}') };
} catch (_) {
    localStorage.removeItem(SHOP_KEY);
}

const clearRandomPowerups = window.spawnPipe;
window.spawnPipe = function () {
    clearRandomPowerups();
    powerUps.length = 0;
};
window.activatePowerUp = function () {
    // Purchased power-ups are granted from the entrance shop, never from gameplay drops.
};

function renderShop() {
    document.getElementById('livesStock').textContent = shopInventory.lives;
    document.getElementById('shieldsStock').textContent = shopInventory.shields;
    document.getElementById('magnetsStock').textContent = shopInventory.magnets;
    updateShieldButton();
}

function saveShopInventory() {
    try { localStorage.setItem(SHOP_KEY, JSON.stringify(shopInventory)); } catch (_) {}
    renderShop();
}

function buyPowerup(kind) {
    if (!Object.prototype.hasOwnProperty.call(shopInventory, kind)) return;
    shopInventory[kind] = Number(shopInventory[kind] || 0) + 10;
    saveShopInventory();
    const feedback = document.getElementById('shop-feedback');
    if (feedback) {
        const names = { lives: 'ekstra can', shields: 'kalkan', magnets: 'mıknatıs' };
        feedback.textContent = '✅ 10 ' + names[kind] + ' eklendi. Güncel stok: ' + shopInventory[kind];
        feedback.classList.add('visible');
    }
}
window.buyPowerup = buyPowerup;

// Delegate the clicks so every BUY button uses the same purchase handler.
document.getElementById('future-shop').addEventListener('click', event => {
    const button = event.target.closest('.buy-item');
    if (button) buyPowerup(button.dataset.kind);
});

function updateShieldButton() {
    const button = document.getElementById('useShieldBtn');
    if (!button) return;
    const available = Math.max(0, shopInventory.shields - runUsage.shields);
    button.textContent = '🛡️ KALKAN · ' + available + ' | S';
    button.disabled = !gameRunning || available === 0 || shieldActive;
}

function startPurchasedRun() {
    if (!gameRunning || runIsActive) return;
    runIsActive = true;
    runUsage = { lives: 0, shields: 0, magnets: 0 };
    lives = 1 + shopInventory.lives;

    // One magnet automatically lasts from the beginning to the end of this run.
    runMagnetActive = shopInventory.magnets > 0;
    if (runMagnetActive) {
        runUsage.magnets = 1;
        magnetActive = true;
        magnetTimer = 60000;
    }

    document.getElementById('useShieldBtn').classList.remove('hidden');
    updateShieldButton();
}

function finishPurchasedRun() {
    if (!runIsActive) return;
    runIsActive = false;
    runMagnetActive = false;
    magnetActive = false;
    shopInventory.lives = Math.max(0, shopInventory.lives - runUsage.lives);
    shopInventory.shields = Math.max(0, shopInventory.shields - runUsage.shields);
    shopInventory.magnets = Math.max(0, shopInventory.magnets - runUsage.magnets);
    runUsage = { lives: 0, shields: 0, magnets: 0 };
    localStorage.setItem(SHOP_KEY, JSON.stringify(shopInventory));
    document.getElementById('useShieldBtn').classList.add('hidden');
    renderShop();
}

function useShield() {
    if (!gameRunning || !runIsActive || shieldActive) return;
    if (shopInventory.shields - runUsage.shields <= 0) return;
    runUsage.shields++;
    shieldActive = true;
    shieldTimer = 5000;
    updateShieldButton();
}

document.getElementById('useShieldBtn').addEventListener('click', useShield);
document.addEventListener('keydown', event => {
    if (event.code === 'KeyS' && gameRunning) {
        event.preventDefault();
        useShield();
    }
});

document.getElementById('startBtn').addEventListener('click', startPurchasedRun);
document.getElementById('restartBtn').addEventListener('click', startPurchasedRun);

const originalGameOver = window.gameOver;
window.gameOver = function () {
    // A live shield blocks both wall and floor impacts.
    if (shieldActive && shieldTimer > 0) return;

    const livesBeforeHit = lives;
    originalGameOver();
    if (lives < livesBeforeHit) {
        runUsage.lives += livesBeforeHit - lives;
        // Respawn in the flight lane so a purchased life is not immediately spent again.
        bird.y = canvas.height / 2 - bird.height / 2;
        bird.velocity = JUMP_FORCE;
    }
    if (!gameRunning) finishPurchasedRun();
    else updateShieldButton();
};

const originalWinGame = window.winGame;
window.winGame = function () {
    originalWinGame();
    finishPurchasedRun();
};

const originalUpdate = window.update;
window.update = function (dt, timestamp) {
    if (runMagnetActive && gameRunning) {
        magnetActive = true;
        magnetTimer = 60000;
    }
    originalUpdate(dt, timestamp);
    if (runMagnetActive && gameRunning) {
        magnetActive = true;
        magnetTimer = 60000;
    }
    updateShieldButton();
};

const originalDraw = window.draw;
window.draw = function () {
    originalDraw();
    if (runMagnetActive && gameRunning) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 10, 20, 0.92)';
        ctx.fillRect(10, 134, 124, 19);
        ctx.fillStyle = '#ff80f5';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲 MAGNET · ACTIVE', 16, 144);
        ctx.restore();
    }
};

powerUps.length = 0;
renderShop();
