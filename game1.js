const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

const WIN_SCORE = 150;

let bird, pipes, coins, powerUps, floatingTexts, coinScore, coinCount, obstaclesPassed, gameRunning;
let lastSpawnTime, lastTimestamp, currentSpeed, speedLevel;
let fuel, lives, shieldActive, shieldTimer, magnetActive, magnetTimer;

const GRAVITY = 0.45;
const JUMP_FORCE = -8.5;
const MAX_FALL_SPEED = 10;
const PIPE_GAP = 200;
const PIPE_WIDTH = 80;
const PIPE_SPAWN_INTERVAL = 1900;
const BIRD_WIDTH = 60;
const BIRD_HEIGHT = 50;

const BASE_SPEED = 3.3;
const SPEED_INCREMENT = 0.5;
const MAX_SPEED_LEVEL = 7;
const OBSTACLES_PER_SPEED_LEVEL = 30;

// ============ COIN TİPLERİ (Puan değerleri) ============
const COIN_TYPES = [
    { symbol: 'Z', name: 'ZED',   color: '#00e5ff', value: 15 },
    { symbol: '₿', name: 'BTC',   color: '#f7931a', value: 12 },
    { symbol: 'Ξ', name: 'ETH',   color: '#627eea', value: 11 },
    { symbol: '◎', name: 'SOL',   color: '#14f195', value: 10 },
    { symbol: 'K', name: 'KASPA', color: '#70c7ba', value: 9 },
    { symbol: 'N', name: 'NEXA',  color: '#9b59b6', value: 8 },
    { symbol: '🐕', name: 'SHIBA', color: '#f00500', value: 7 }
];

// ============ POWER-UP TİPLERİ ============
const POWERUP_TYPES = [
    { type: 'shield',     icon: '🛡️', color: '#00ffff', duration: 5000 },
    { type: 'extraLife',  icon: '❤️', color: '#ff0000', duration: 0 },
    { type: 'magnet',     icon: '🧲', color: '#ff00ff', duration: 8000 },
    { type: 'timeExtend', icon: '⏱️', color: '#ffcc00', duration: 0 }
];

// ============ SPRITE ============
const zedSprite = new Image();
zedSprite.src = 'images/zed-sprite.png';
let spriteLoaded = false;
zedSprite.onload = () => { spriteLoaded = true; };

function init() {
    bird = {
        x: 80,
        y: canvas.height / 2 - BIRD_HEIGHT / 2,
        width: BIRD_WIDTH,
        height: BIRD_HEIGHT,
        velocity: 0,
        rotation: 0
    };
    pipes = [];
    coins = [];
    powerUps = [];
    floatingTexts = [];
    coinScore = 0;
    coinCount = 0;
    obstaclesPassed = 0;
    gameRunning = false;
    lastSpawnTime = 0;
    lastTimestamp = 0;
    currentSpeed = BASE_SPEED;
    speedLevel = 0;
    fuel = WIN_SCORE;
    lives = 1;
    shieldActive = false;
    shieldTimer = 0;
    magnetActive = false;
    magnetTimer = 0;
}

function startGame() {
    init();
    bird.y = canvas.height / 2 - BIRD_HEIGHT / 2;
    bird.velocity = JUMP_FORCE;
    bird.rotation = -0.1;
    gameRunning = true;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');

    lastSpawnTime = performance.now();
    lastTimestamp = 0;
    requestAnimationFrame(gameLoop);
}

function updateSpeed() {
    const newLevel = Math.min(Math.floor(obstaclesPassed / OBSTACLES_PER_SPEED_LEVEL), MAX_SPEED_LEVEL);
    if (newLevel > speedLevel) {
        speedLevel = newLevel;
        currentSpeed = BASE_SPEED + (speedLevel * SPEED_INCREMENT);
    }
}


function gameLoop(timestamp) {
    if (!gameRunning) return;
    if (!lastTimestamp) lastTimestamp = timestamp;
    let deltaTime = (timestamp - lastTimestamp) / 1000;
    if (deltaTime > 0.1) deltaTime = 0.1;
    lastTimestamp = timestamp;
    const dt = deltaTime * 60;

    if (shieldActive) {
        shieldTimer -= deltaTime * 1000;
        if (shieldTimer <= 0) shieldActive = false;
    }
    if (magnetActive) {
        magnetTimer -= deltaTime * 1000;
        if (magnetTimer <= 0) magnetActive = false;
    }

    update(dt, timestamp);
    draw();
    if (gameRunning) requestAnimationFrame(gameLoop);
}

function update(dt, timestamp) {
    bird.velocity += GRAVITY * dt;
    if (bird.velocity > MAX_FALL_SPEED) bird.velocity = MAX_FALL_SPEED;
    bird.y += bird.velocity * dt;

    let targetRotation = Math.min(Math.max(bird.velocity * 0.04, -0.3), 0.6);
    bird.rotation += (targetRotation - bird.rotation) * 0.15 * dt;

    // Borular
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= currentSpeed * dt;
        if (!shieldActive && checkCollision(bird, pipes[i])) { gameOver(); return; }
        if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].passed = true;
            obstaclesPassed++;
            fuel = Math.max(0, WIN_SCORE - obstaclesPassed);
            updateSpeed();
            if (obstaclesPassed >= WIN_SCORE) { winGame(); return; }
        }
        if (pipes[i].x + pipes[i].width < 0) pipes.splice(i, 1);
    }

    // Coinler
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= currentSpeed * dt;
        coins[i].rotation += 0.08 * dt;

        // Mıknatıs etkisi
        if (magnetActive) {
            const dx = (bird.x + bird.width / 2) - coins[i].x;
            const dy = (bird.y + bird.height / 2) - coins[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 0) {
                coins[i].x += (dx / dist) * 8 * dt;
                coins[i].y += (dy / dist) * 8 * dt;
            }
        }

        if (checkCoinCollision(bird, coins[i])) {
            // PUAN EKLE
            coinScore += coins[i].value;
            coinCount++;

            // Uçan yazı ekle
            floatingTexts.push({
                x: coins[i].x,
                y: coins[i].y,
                text: '+' + coins[i].value + ' ' + coins[i].name,
                color: coins[i].color,
                life: 1.0,
                vy: -1.5
            });

            // Coin puanları birikir; bölüm yalnızca 150 engel geçilince tamamlanır.
            coins.splice(i, 1);
            continue;
        }
        if (coins[i].x + coins[i].radius < 0) coins.splice(i, 1);
    }

    // Power-up'lar
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].x -= currentSpeed * dt;
        powerUps[i].rotation += 0.05 * dt;
        if (checkPowerUpCollision(bird, powerUps[i])) {
            activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
            continue;
        }
        if (powerUps[i].x + powerUps[i].radius < 0) powerUps.splice(i, 1);
    }

    // Uçan yazılar
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y += floatingTexts[i].vy * dt;
        floatingTexts[i].life -= 0.02 * dt;
        floatingTexts[i].x -= currentSpeed * dt * 0.5;
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    if (bird.y + bird.height >= canvas.height) {
        bird.y = canvas.height - bird.height;
        gameOver();
        return;
    }
    if (bird.y < 0) { bird.y = 0; bird.velocity = 0; }

    if (timestamp - lastSpawnTime > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastSpawnTime = timestamp;
    }
}

function activatePowerUp(type) {
    if (type === 'shield') { shieldActive = true; shieldTimer = 5000; }
    else if (type === 'extraLife') { lives++; }
    else if (type === 'magnet') { magnetActive = true; magnetTimer = 8000; }
    else if (type === 'timeExtend') { fuel = Math.min(fuel + 10, WIN_SCORE); }
}

function checkCollision(bird, pipe) {
    const birdLeft = bird.x + 12;
    const birdRight = bird.x + bird.width - 12;
    const birdTop = bird.y + 10;
    const birdBottom = bird.y + bird.height - 10;
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;

    if (birdRight > pipeLeft && birdLeft < pipeRight &&
        birdBottom > 0 && birdTop < pipe.gapY) return true;

    const bottomTop = pipe.gapY + pipe.gap;
    if (birdRight > pipeLeft && birdLeft < pipeRight &&
        birdBottom > bottomTop && birdTop < canvas.height) return true;

    return false;
}

function checkCoinCollision(bird, coin) {
    const cx = bird.x + bird.width / 2;
    const cy = bird.y + bird.height / 2;
    const dx = cx - coin.x;
    const dy = cy - coin.y;
    return Math.sqrt(dx * dx + dy * dy) < (bird.width / 2) + coin.radius;
}

function checkPowerUpCollision(bird, pu) {
    const cx = bird.x + bird.width / 2;
    const cy = bird.y + bird.height / 2;
    const dx = cx - pu.x;
    const dy = cy - pu.y;
    return Math.sqrt(dx * dx + dy * dy) < (bird.width / 2) + pu.radius;
}

// ============ DUVAR + POSTER ============
function drawUndergroundWall(x, y, w, h, isTop, character, lightLevel, slogan) {
    ctx.save();
    const baseR = Math.floor(42 + lightLevel * 40);
    const baseG = Math.floor(42 + lightLevel * 40);
    const baseB = Math.floor(42 + lightLevel * 40);
    const wallGradient = ctx.createLinearGradient(x, 0, x + w, 0);
    wallGradient.addColorStop(0, `rgb(${baseR - 20}, ${baseG - 20}, ${baseB - 20})`);
    wallGradient.addColorStop(0.5, `rgb(${baseR}, ${baseG}, ${baseB})`);
    wallGradient.addColorStop(1, `rgb(${baseR - 30}, ${baseG - 30}, ${baseB - 30})`);
    ctx.fillStyle = wallGradient;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
    for (let i = 0; i < 5; i++) {
        const lx = x + (i * 17) % w;
        const ly = y + (i * 23) % h;
        ctx.beginPath();
        ctx.arc(lx, ly, 8 + (i % 3) * 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(x + 8, y + 20 + i * 40, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w - 8, y + 20 + i * 40, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + w - 6, y, 6, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, 4, h);

    const posterH = 90;
    const posterW = w - 16;
    const posterX = x + 8;
    let posterY;
    if (isTop) posterY = y + h - posterH - 15;
    else posterY = y + 15;

    if (h > 120) {
        ctx.globalAlpha = Math.max(0, 1 - lightLevel * 1.5);
        ctx.fillStyle = '#d4c5a0';
        ctx.fillRect(posterX, posterY, posterW, posterH);
        ctx.fillStyle = '#a89670';
        ctx.fillRect(posterX, posterY, posterW, 3);
        ctx.fillRect(posterX, posterY + posterH - 3, posterW, 3);
        if (character === 'krump') drawKrumpPoster(posterX, posterY, posterW, posterH, slogan);
        else drawZorakPoster(posterX, posterY, posterW, posterH, slogan);
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

function drawKrumpPoster(px, py, pw, ph, slogan) {
    const cx = px + pw / 2;
    const cy = py + 49;
    // Orange-haired boss in the pink suit from the reference.
    ctx.fillStyle = '#771329';
    ctx.fillRect(px + 2, py + 2, pw - 4, 14);
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KRUMP', cx, py + 9);

    // Pink jacket and red tie frame the portrait.
    ctx.fillStyle = '#ec4f9b';
    ctx.beginPath();
    ctx.moveTo(cx - 25, py + ph - 4);
    ctx.lineTo(cx - 21, cy + 10);
    ctx.lineTo(cx - 11, cy + 18);
    ctx.lineTo(cx, cy + 13);
    ctx.lineTo(cx + 11, cy + 18);
    ctx.lineTo(cx + 22, cy + 10);
    ctx.lineTo(cx + 25, py + ph - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff5ee';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 12); ctx.lineTo(cx, cy + 19); ctx.lineTo(cx + 8, cy + 12);
    ctx.lineTo(cx + 4, py + ph - 4); ctx.lineTo(cx - 4, py + ph - 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e52235';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 15); ctx.lineTo(cx - 3, cy + 21);
    ctx.lineTo(cx, py + ph - 4); ctx.lineTo(cx + 3, cy + 21);
    ctx.closePath(); ctx.fill();

    // Face, ears and swept flame-like orange hair.
    ctx.fillStyle = '#f2b477';
    ctx.beginPath(); ctx.ellipse(cx - 15, cy - 1, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 15, cy - 1, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy, 15, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a18';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 8);
    ctx.quadraticCurveTo(cx - 29, cy - 21, cx - 17, cy - 30);
    ctx.lineTo(cx - 11, cy - 22); ctx.lineTo(cx - 4, cy - 33);
    ctx.lineTo(cx + 1, cy - 22); ctx.lineTo(cx + 11, cy - 31);
    ctx.lineTo(cx + 11, cy - 21); ctx.quadraticCurveTo(cx + 26, cy - 27, cx + 16, cy - 5);
    ctx.quadraticCurveTo(cx + 4, cy - 14, cx - 15, cy - 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#783020'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 4); ctx.lineTo(cx - 3, cy - 1);
    ctx.moveTo(cx + 11, cy - 4); ctx.lineTo(cx + 3, cy - 1);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx - 7, cy + 2, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 7, cy + 2, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#241719';
    ctx.beginPath(); ctx.arc(cx - 7, cy + 2, 1.6, 0, Math.PI * 2); ctx.arc(cx + 7, cy + 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#64232a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy + 12); ctx.lineTo(cx + 5, cy + 12); ctx.stroke();

    drawPosterSlogan(px, py, pw, ph, slogan, '#761329');
}

function drawZorakPoster(px, py, pw, ph, slogan) {
    const cx = px + pw / 2;
    const cy = py + 49;
    // The bespectacled boy in a black shirt from the reference.
    ctx.fillStyle = '#061d25';
    ctx.fillRect(px + 2, py + 2, pw - 4, 14);
    ctx.fillStyle = '#8cf5ff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ZORAK', cx, py + 9);

    ctx.fillStyle = '#11151c';
    ctx.beginPath();
    ctx.moveTo(cx - 23, py + ph - 4); ctx.lineTo(cx - 20, cy + 13);
    ctx.lineTo(cx - 9, cy + 9); ctx.lineTo(cx, cy + 15);
    ctx.lineTo(cx + 9, cy + 9); ctx.lineTo(cx + 20, cy + 13);
    ctx.lineTo(cx + 23, py + ph - 4);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#e7ad80';
    ctx.beginPath(); ctx.ellipse(cx - 14, cy, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 14, cy, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy, 14, 18, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#171419';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 5);
    ctx.quadraticCurveTo(cx - 18, cy - 25, cx - 2, cy - 27);
    ctx.quadraticCurveTo(cx + 13, cy - 29, cx + 17, cy - 9);
    ctx.lineTo(cx + 12, cy - 13); ctx.lineTo(cx + 5, cy - 17);
    ctx.lineTo(cx - 1, cy - 12); ctx.lineTo(cx - 9, cy - 15);
    ctx.closePath(); ctx.fill();

    // Thick square glasses are the defining feature of this portrait.
    ctx.strokeStyle = '#171a20'; ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(190,225,245,.24)';
    ctx.beginPath(); ctx.roundRect(cx - 13, cy - 4, 11, 9, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(cx + 2, cy - 4, 11, 9, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 2, cy); ctx.lineTo(cx + 2, cy); ctx.stroke();
    ctx.fillStyle = '#f8f5ec';
    ctx.beginPath(); ctx.arc(cx - 7, cy, 2, 0, Math.PI * 2); ctx.arc(cx + 7, cy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#171419';
    ctx.beginPath(); ctx.arc(cx - 7, cy, 1, 0, Math.PI * 2); ctx.arc(cx + 7, cy, 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a2422'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - 5, cy + 11); ctx.lineTo(cx + 5, cy + 11); ctx.stroke();

    drawPosterSlogan(px, py, pw, ph, slogan, '#061d25');
}

function drawPosterSlogan(px, py, pw, ph, slogan, color) {
    ctx.fillStyle = color;
    ctx.fillRect(px + 2, py + ph - 20, pw - 4, 17);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fontSize = 7;
    ctx.font = 'bold ' + fontSize + 'px Arial';
    while (ctx.measureText(slogan).width > pw - 7 && fontSize > 5) {
        fontSize--;
        ctx.font = 'bold ' + fontSize + 'px Arial';
    }
    ctx.fillText(slogan, px + pw / 2, py + ph - 11);
}

// ============ ZED ============
function drawZed(cx, cy, rotation, fuelRatio, t) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation * 0.5);
    const bob = Math.sin(t / 200) * 3;
    ctx.translate(0, bob);

    if (fuelRatio > 0.1 && spriteLoaded) {
        const flameX = -35, flameY = 5;
        const flameLen = (15 + Math.random() * 8) * fuelRatio;
        const fg = ctx.createRadialGradient(flameX, flameY, 0, flameX - 5, flameY, flameLen);
        fg.addColorStop(0, '#ffffff');
        fg.addColorStop(0.3, '#ffdd00');
        fg.addColorStop(0.6, '#ff6600');
        fg.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(flameX - 5, flameY, flameLen, 0, Math.PI * 2);
        ctx.fill();
    }

    if (spriteLoaded) {
        ctx.drawImage(zedSprite, -bird.width / 2 - 10, -bird.height / 2 - 5, bird.width + 20, bird.height + 10);
    } else {
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (shieldActive) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// ============ BACKGROUND ============
function drawBackground(lightLevel) {
    const topR = Math.floor(10 + lightLevel * 40);
    const topG = Math.floor(10 + lightLevel * 100);
    const topB = Math.floor(10 + lightLevel * 180);
    const botR = Math.floor(10 + lightLevel * 20);
    const botG = Math.floor(10 + lightLevel * 60);
    const botB = Math.floor(10 + lightLevel * 120);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
    gradient.addColorStop(1, `rgb(${botR}, ${botG}, ${botB})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (lightLevel < 0.7) {
        ctx.strokeStyle = `rgba(80, 80, 80, ${0.15 * (1 - lightLevel)})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 30);
            ctx.lineTo(canvas.width, i * 30);
            ctx.stroke();
        }
    }
    if (lightLevel < 0.8) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.6 * (1 - lightLevel)})`;
        for (let i = 0; i < 5; i++) {
            const x = (i * 100 + (Date.now() / 50) % 100);
            ctx.beginPath();
            ctx.arc(x, 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    if (lightLevel > 0.4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${lightLevel - 0.4})`;
        for (let i = 0; i < 40; i++) {
            ctx.fillRect((i * 67) % canvas.width, (i * 41) % (canvas.height * 0.6), 2, 2);
        }
    }
    ctx.fillStyle = `rgba(60, 60, 60, ${0.3 * (1 - lightLevel)})`;
    ctx.fillRect(0, 50, canvas.width, 3);
    ctx.fillRect(0, canvas.height - 50, canvas.width, 3);
}

// ============ FUEL BAR ============
function drawFuelBar() {
    const barWidth = 180, barHeight = 14;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = 110;
    const fuelRatio = Math.max(0, Math.min(obstaclesPassed / WIN_SCORE, 1));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const fuelGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    if (fuelRatio > 0.5) {
        fuelGradient.addColorStop(0, '#00ff88');
        fuelGradient.addColorStop(1, '#00ffff');
    } else if (fuelRatio > 0.2) {
        fuelGradient.addColorStop(0, '#ffcc00');
        fuelGradient.addColorStop(1, '#ff6600');
    } else {
        fuelGradient.addColorStop(0, '#ff0000');
        fuelGradient.addColorStop(1, '#ff4444');
    }
    ctx.fillStyle = fuelGradient;
    ctx.fillRect(barX, barY, barWidth * fuelRatio, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#000';
    ctx.fillText('ENGEL: ' + obstaclesPassed + ' / ' + WIN_SCORE, canvas.width / 2, barY - 5);
    ctx.shadowBlur = 0;
}

// ============ POWER-UP ÇİZİM ============
function drawPowerUp(pu) {
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.rotate(pu.rotation);
    ctx.shadowBlur = 15;
    ctx.shadowColor = pu.color;
    ctx.fillStyle = pu.color;
    ctx.beginPath();
    ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pu.icon, 0, 0);
    ctx.restore();
}

// ============ DRAW ============
function draw() {
    const lightLevel = Math.min(obstaclesPassed / WIN_SCORE, 1);
    const t = performance.now();
    drawBackground(lightLevel);

    pipes.forEach(pipe => {
        const bottomY = pipe.gapY + pipe.gap;
        const bottomHeight = canvas.height - bottomY;
        drawUndergroundWall(pipe.x, 0, pipe.width, pipe.gapY, true, pipe.character, lightLevel, pipe.slogan);
        drawUndergroundWall(pipe.x, bottomY, pipe.width, bottomHeight, false, pipe.character, lightLevel, pipe.slogan);
    });

    // Coinler
    coins.forEach(coin => {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.rotate(coin.rotation);
        ctx.fillStyle = coin.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = coin.color;
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(coin.symbol, 0, 0);
        ctx.restore();
    });

    // Power-up'lar
    powerUps.forEach(pu => drawPowerUp(pu));

    // Zed
    const fuelRatio = Math.max(0, fuel / WIN_SCORE);
    drawZed(bird.x + bird.width / 2, bird.y + bird.height / 2, bird.rotation, fuelRatio, t);

    // Uçan yazılar
    floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#000';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#000';
    ctx.fillText('COIN PUANI: ' + coinScore, 20, 45);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Coins: ' + coinCount, 20, 75);
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Speed: ' + speedLevel + '/' + MAX_SPEED_LEVEL, canvas.width - 20, 45);
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'right';
    ctx.fillText('ENGEL: ' + obstaclesPassed + '/' + WIN_SCORE, canvas.width - 20, 65);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('❤️ ' + lives, 20, 100);

    if (shieldActive) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('🛡️ ' + Math.ceil(shieldTimer / 1000) + 's', 20, 125);
    }
    if (magnetActive) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('🧲 ' + Math.ceil(magnetTimer / 1000) + 's', 20, 145);
    }

    drawFuelBar();
    ctx.fillStyle = lightLevel > 0.7 ? '#00ffff' : '#ff0000';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(lightLevel > 0.7 ? 'SURFACE APPROACHING...' : 'DEPTH 7 → SURFACE', canvas.width - 20, canvas.height - 15);
    ctx.shadowBlur = 0;
}

// ============ SPAWN ============
function spawnPipe() {
    const minGapY = 80;
    const maxGapY = canvas.height - PIPE_GAP - 80;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
    const character = Math.random() > 0.5 ? 'krump' : 'zorak';
    const slogans = character === 'krump'
        ? ['BİZ BÜYÜĞÜZ', 'GÜÇ BİZDE', 'YENİLMEYİZ']
        : ['ZİRVE BİZİM', 'BİZ DAHA GÜÇLÜYÜZ', 'DURDURAMAZSIN'];
    const slogan = slogans[Math.floor(Math.random() * slogans.length)];
    pipes.push({ x: canvas.width, width: PIPE_WIDTH, gapY, gap: PIPE_GAP, passed: false, character, slogan });

    // Her engel için iki coin; ikisi de geçiş boşluğunda görünür.
    for (let coinIndex = 0; coinIndex < 2; coinIndex++) {
        const type = COIN_TYPES[Math.floor(Math.random() * COIN_TYPES.length)];
        coins.push({
            x: canvas.width + PIPE_WIDTH / 2 + coinIndex * 46,
            y: gapY + PIPE_GAP * (coinIndex === 0 ? 0.35 : 0.65),
            radius: 12,
            rotation: 0,
            symbol: type.symbol,
            color: type.color,
            value: type.value,
            name: type.name
        });
    }

    // Power-up spawn
    if (Math.random() > 0.7) {
        const pu = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        powerUps.push({
            x: canvas.width + PIPE_WIDTH / 2,
            y: gapY + PIPE_GAP / 2,
            radius: 14,
            rotation: 0,
            type: pu.type,
            icon: pu.icon,
            color: pu.color
        });
    }
}

function gameOver() {
    if (lives > 1) {
        lives--;
        shieldActive = true;
        shieldTimer = 3000;
        return;
    }
    gameRunning = false;
    document.getElementById('finalScore').textContent = coinScore;
    document.getElementById('finalObstacles').textContent = obstaclesPassed;
    document.getElementById('finalCoins').textContent = coinCount;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function winGame() {
    gameRunning = false;
    document.getElementById('winScore').textContent = coinScore;
    document.getElementById('winObstacles').textContent = obstaclesPassed;
    document.getElementById('winCoins').textContent = coinCount;
    document.getElementById('win-screen').classList.remove('hidden');
    localStorage.setItem('zakardiya_progress', 2);
    const completed = JSON.parse(localStorage.getItem('zakardiya_completed') || '[]');
    if (!completed.includes(1)) {
        completed.push(1);
        localStorage.setItem('zakardiya_completed', JSON.stringify(completed));
    }
}

function zipla() { if (gameRunning) bird.velocity = JUMP_FORCE; }

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); zipla(); }
});
canvas.addEventListener('click', zipla);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); zipla(); }, { passive: false });

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('backBtn').addEventListener('click', () => window.location.href = 'index.html');
document.getElementById('menuBtn').addEventListener('click', () => window.location.href = 'index.html');
document.getElementById('nextGameBtn').addEventListener('click', () => {
    alert('Chapter 2: STICK WAR\n\nComing soon! 🚧');
    window.location.href = 'index.html';
});

init();
