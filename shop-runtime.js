// Persistent BUY inventory and run-based power-up use.
const SHOP_KEY = 'zed_powerup_inventory_v1';
const MAGNET_TIME_KEY = 'zed_magnet_time_remaining_v1';
const MAGNET_DURATION = 25 * 1000;
let shopInventory = { lives: 0, shields: 0, magnets: 0 };
let runUsage = { lives: 0, shields: 0, magnets: 0 };
let runMagnetActive = false;
let runMagnetChargesRemaining = 0;
let magnetTimeRemaining = 0;
let lastMagnetSaveAt = 0;
let runIsActive = false;

try {
    shopInventory = { ...shopInventory, ...JSON.parse(localStorage.getItem(SHOP_KEY) || '{}') };
    magnetTimeRemaining = Math.max(0, Math.min(MAGNET_DURATION, Number(localStorage.getItem(MAGNET_TIME_KEY)) || 0));
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
    const magnetChoice = document.getElementById('magnetUseCount');
    if (magnetChoice) {
        magnetChoice.max = shopInventory.magnets;
        magnetChoice.value = Math.min(Math.max(0, parseInt(magnetChoice.value, 10) || 0), shopInventory.magnets);
    }
    updateShieldButton();
}

function saveShopInventory() {
    try {
        localStorage.setItem(SHOP_KEY, JSON.stringify(shopInventory));
        localStorage.setItem(MAGNET_TIME_KEY, String(magnetTimeRemaining));
    } catch (_) {}
    renderShop();
}

function buyPowerup(kind) {
    if (!Object.prototype.hasOwnProperty.call(shopInventory, kind)) return;
    const previousStock = Number(shopInventory[kind]) || 0;
    shopInventory[kind] = previousStock + 10;
    if (kind === 'magnets' && previousStock === 0) {
        document.getElementById('magnetUseCount').value = '1';
    }
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

    // The player chooses how many 25-second magnet charges to queue for this run.
    const magnetChoice = document.getElementById('magnetUseCount');
    const requestedMagnets = Math.max(0, parseInt(magnetChoice.value, 10) || 0);
    const selectedMagnets = Math.min(requestedMagnets, shopInventory.magnets);
    runMagnetChargesRemaining = Math.max(0, selectedMagnets - 1);
    runMagnetActive = selectedMagnets > 0;
    if (runMagnetActive) {
        magnetActive = true;
        magnetTimer = magnetTimeRemaining > 0 ? magnetTimeRemaining : MAGNET_DURATION;
    } else {
        magnetActive = false;
        magnetTimer = 0;
    }

    document.getElementById('useShieldBtn').classList.remove('hidden');
    updateShieldButton();
}

function finishPurchasedRun() {
    if (!runIsActive) return;
    if (runMagnetActive && magnetActive && magnetTimer > 0) {
        // Keep the unused part of the active 25-second charge for the next attempt.
        magnetTimeRemaining = magnetTimer;
    }
    runIsActive = false;
    runMagnetActive = false;
    runMagnetChargesRemaining = 0;
    magnetActive = false;
    shopInventory.lives = Math.max(0, shopInventory.lives - runUsage.lives);
    shopInventory.shields = Math.max(0, shopInventory.shields - runUsage.shields);
    shopInventory.magnets = Math.max(0, shopInventory.magnets - runUsage.magnets);
    runUsage = { lives: 0, shields: 0, magnets: 0 };
    saveShopInventory();
    document.getElementById('useShieldBtn').classList.add('hidden');
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
    if (runMagnetActive && gameRunning && magnetTimer <= 0) {
        // A charge is consumed only after its full 25 seconds have elapsed.
        runUsage.magnets++;
        magnetTimeRemaining = 0;
        if (runMagnetChargesRemaining > 0 && runUsage.magnets < shopInventory.magnets) {
            runMagnetChargesRemaining--;
            magnetActive = true;
            magnetTimer = MAGNET_DURATION;
        } else {
            runMagnetActive = false;
            magnetActive = false;
        }
    }

    if (runMagnetActive && magnetActive && timestamp - lastMagnetSaveAt > 1000) {
        magnetTimeRemaining = magnetTimer;
        try { localStorage.setItem(MAGNET_TIME_KEY, String(magnetTimeRemaining)); } catch (_) {}
        lastMagnetSaveAt = timestamp;
    }
    originalUpdate(dt, timestamp);
    updateShieldButton();
};

const originalDraw = window.draw;
window.draw = function () {
    originalDraw();
    if (runMagnetActive && gameRunning) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 10, 20, 0.92)';
        ctx.fillRect(10, 134, 180, 19);
        ctx.fillStyle = '#ff80f5';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const remainingSeconds = Math.ceil(magnetTimer / 1000);
        const remainingTime = Math.floor(remainingSeconds / 60) + ':' + String(remainingSeconds % 60).padStart(2, '0');
        const queuedLabel = runMagnetChargesRemaining > 0 ? ' +' + runMagnetChargesRemaining : '';
        ctx.fillText('🧲 MAGNET ' + remainingTime + queuedLabel, 16, 144);
        ctx.restore();
    }
};

powerUps.length = 0;
renderShop();
