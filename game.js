const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// ============ OYUN DEĞİŞKENLERİ ============
let bird, pipes, coins, score, coinCount, gameRunning;
let lastSpawnTime, lastTimestamp, currentSpeed, speedLevel;

// Renkler
const COIN_COLOR = '#00ffff';

// ============ FİZİK AYARLARI ============
const GRAVITY = 0.45;
const JUMP_FORCE = -8.5;
const MAX_FALL_SPEED = 10;
const PIPE_GAP = 200;              // Engeller arası açıldı (170 → 200)
const PIPE_WIDTH = 70;
const PIPE_SPAWN_INTERVAL = 1900;  // Biraz daha seyrek
const BIRD_WIDTH = 38;             // Yatırımcı biraz daha büyük
const BIRD_HEIGHT = 42;

// ============ HIZ ARTIŞ SİSTEMİ ============
const BASE_SPEED = 2.8;
const SPEED_INCREMENT = 0.5;
const MAX_SPEED_LEVEL = 5;
const SCORE_PER_LEVEL = 20;

// ============ BAŞLATMA ============
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
    score = 0;
    coinCount = 0;
    gameRunning = false;
    lastSpawnTime = 0;
    lastTimestamp = 0;
    currentSpeed = BASE_SPEED;
    speedLevel = 0;
}

// ============ OYUNU BAŞLAT ============
function startGame() {
    init();
    bird.y = canvas.height / 2 - BIRD_HEIGHT / 2;
    bird.velocity = JUMP_FORCE;   // Otomatik yukarı zıplama!
    bird.rotation = -0.3;
    gameRunning = true;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    lastSpawnTime = performance.now();
    lastTimestamp = 0;
    requestAnimationFrame(gameLoop);
}

// ============ HIZ GÜNCELLE ============
function updateSpeed() {
    const newLevel = Math.min(Math.floor(score / SCORE_PER_LEVEL), MAX_SPEED_LEVEL);
    if (newLevel > speedLevel) {
        speedLevel = newLevel;
        currentSpeed = BASE_SPEED + (speedLevel * SPEED_INCREMENT);
        showSpeedUpMessage();
    }
}

function showSpeedUpMessage() {
    const msg = document.getElementById('speed-message');
    if (msg) {
        msg.textContent = '⚡ HIZ ARTTI! Seviye ' + speedLevel;
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 1200);
    }
}

// ============ OYUN DÖNGÜSÜ ============
function gameLoop(timestamp) {
    if (!gameRunning) return;
    if (!lastTimestamp) lastTimestamp = timestamp;

    let deltaTime = (timestamp - lastTimestamp) / 1000;
    if (deltaTime > 0.1) deltaTime = 0.1;
    lastTimestamp = timestamp;

    const dt = deltaTime * 60;

    update(dt, timestamp);
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// ============ GÜNCELLEME ============
function update(dt, timestamp) {
    // Yatırımcı fiziği
    bird.velocity += GRAVITY * dt;
    if (bird.velocity > MAX_FALL_SPEED) bird.velocity = MAX_FALL_SPEED;
    bird.y += bird.velocity * dt;

    let targetRotation = Math.min(Math.max(bird.velocity * 0.06, -0.5), 1.0);
    bird.rotation += (targetRotation - bird.rotation) * 0.15 * dt;

    // Boruları güncelle
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= currentSpeed * dt;

        if (checkCollision(bird, pipes[i])) {
            gameOver();
            return;
        }

        if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].passed = true;
            score++;
            updateSpeed();
        }

        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
        }
    }

    // Coin'leri güncelle
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= currentSpeed * dt;
        coins[i].rotation += 0.08 * dt;

        if (checkCoinCollision(bird, coins[i])) {
            coinCount++;
            coins.splice(i, 1);
            continue;
        }

        if (coins[i].x + coins[i].radius < 0) {
            coins.splice(i, 1);
        }
    }

    if (bird.y + bird.height >= canvas.height) {
        bird.y = canvas.height - bird.height;
        gameOver();
        return;
    }

    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    if (timestamp - lastSpawnTime > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastSpawnTime = timestamp;
    }
}

// ============ ÇARPIŞMA KONTROLÜ ============
function checkCollision(bird, pipe) {
    const birdLeft = bird.x + 6;
    const birdRight = bird.x + bird.width - 6;
    const birdTop = bird.y + 6;
    const birdBottom = bird.y + bird.height - 6;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;

    if (birdRight > pipeLeft && birdLeft < pipeRight &&
        birdBottom > 0 && birdTop < pipe.gapY) {
        return true;
    }

    const bottomTop = pipe.gapY + pipe.gap;
    if (birdRight > pipeLeft && birdLeft < pipeRight &&
        birdBottom > bottomTop && birdTop < canvas.height) {
        return true;
    }

    return false;
}

function checkCoinCollision(bird, coin) {
    const birdCenterX = bird.x + bird.width / 2;
    const birdCenterY = bird.y + bird.height / 2;
    const dx = birdCenterX - coin.x;
    const dy = birdCenterY - coin.y;
    return Math.sqrt(dx * dx + dy * dy) < (bird.width / 2) + coin.radius;
}

// ============ KRUMP BLOĞU ============
function drawKrumpBlock(x, y, w, h, isTop) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff69b4';
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + w - 8, y, 8, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y, 6, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w / 2 - 6, y, 12, h);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x + w / 2 - 4, y, 8, h);

    if (isTop) {
        const faceY = y + h - 55;
        if (faceY > y && h > 70) {
            ctx.fillStyle = '#ffb366';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY + 15, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff6600';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 5, 22, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - 15, faceY + 8); ctx.lineTo(x + w / 2 - 4, faceY + 12);
            ctx.moveTo(x + w / 2 + 15, faceY + 8); ctx.lineTo(x + w / 2 + 4, faceY + 12);
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + w / 2 - 7, faceY + 14, 2.5, 0, Math.PI * 2);
            ctx.arc(x + w / 2 + 7, faceY + 14, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x + w / 2, faceY + 26, 6, 0, Math.PI); ctx.stroke();
        }
    } else {
        const faceY = y + 55;
        if (faceY < y + h && h > 70) {
            ctx.fillStyle = '#ffb366';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 15, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff6600';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 35, 22, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - 15, faceY - 22); ctx.lineTo(x + w / 2 - 4, faceY - 18);
            ctx.moveTo(x + w / 2 + 15, faceY - 22); ctx.lineTo(x + w / 2 + 4, faceY - 18);
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + w / 2 - 7, faceY - 16, 2.5, 0, Math.PI * 2);
            ctx.arc(x + w / 2 + 7, faceY - 16, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 4, 6, 0, Math.PI); ctx.stroke();
        }
    }
    ctx.restore();
}

// ============ ZED BLOĞU ============
function drawZedBlock(x, y, w, h, isTop) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + w - 8, y, 8, h);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.fillRect(x, y, 6, h);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isTop) ctx.fillText('Z', x + w / 2, y + h - 30);
    else ctx.fillText('Z', x + w / 2, y + 30);

    if (isTop) {
        const faceY = y + h - 55;
        if (faceY > y && h > 70) {
            ctx.fillStyle = '#f5c99b';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY + 15, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 3, 22, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath(); ctx.arc(x + w / 2 - 9, faceY + 14, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + w / 2 + 9, faceY + 14, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + w / 2 - 2, faceY + 14); ctx.lineTo(x + w / 2 + 2, faceY + 14); ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + w / 2 - 9, faceY + 14, 2, 0, Math.PI * 2);
            ctx.arc(x + w / 2 + 9, faceY + 14, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + w / 2 - 5, faceY + 26); ctx.lineTo(x + w / 2 + 5, faceY + 26); ctx.stroke();
        }
    } else {
        const faceY = y + 55;
        if (faceY < y + h && h > 70) {
            ctx.fillStyle = '#f5c99b';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 15, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(x + w / 2, faceY - 33, 22, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath(); ctx.arc(x + w / 2 - 9, faceY - 16, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + w / 2 + 9, faceY - 16, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + w / 2 - 2, faceY - 16); ctx.lineTo(x + w / 2 + 2, faceY - 16); ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + w / 2 - 9, faceY - 16, 2, 0, Math.PI * 2);
            ctx.arc(x + w / 2 + 9, faceY - 16, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + w / 2 - 5, faceY - 4); ctx.lineTo(x + w / 2 + 5, faceY - 4); ctx.stroke();
        }
    }
    ctx.restore();
}

// ============ YATIRIMCI + FÜZE ÇİZİMİ ============
function drawInvestor(cx, cy, rotation) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // ===== FÜZE (arkada) =====
    // Füze gövdesi
    ctx.fillStyle = '#888';
    ctx.fillRect(-24, -6, 20, 12);
    // Füze ucu
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(-24, -6);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-24, 6);
    ctx.closePath();
    ctx.fill();
    // Kanatçıklar
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(-8, -6); ctx.lineTo(-4, -12); ctx.lineTo(-6, -6); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 6); ctx.lineTo(-4, 12); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
    // Alev
    const flameLength = 10 + Math.random() * 8;
    const flameGradient = ctx.createLinearGradient(-24, 0, -24 - flameLength, 0);
    flameGradient.addColorStop(0, '#ffcc00');
    flameGradient.addColorStop(0.5, '#ff6600');
    flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-24, -5);
    ctx.lineTo(-24 - flameLength, 0);
    ctx.lineTo(-24, 5);
    ctx.closePath();
    ctx.fill();

    // ===== YATIRIMCI (önde) =====
    // Bacaklar (pantolon)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-4, 10, 6, 12);
    ctx.fillRect(4, 10, 6, 12);
    // Ayakkabılar
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, 20, 8, 4);
    ctx.fillRect(3, 20, 8, 4);

    // Gövde (takım elbise - lacivert)
    ctx.fillStyle = '#1a2a4a';
    ctx.beginPath();
    ctx.roundRect(-10, -8, 22, 22, 4);
    ctx.fill();

    // Beyaz gömlek
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -8, 6, 18);

    // Kırmızı kravat
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-3, -2);
    ctx.lineTo(0, 10);
    ctx.lineTo(3, -2);
    ctx.closePath();
    ctx.fill();

    // Kollar
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(-14, -6, 6, 14);   // Sol kol (öne doğru)
    ctx.fillRect(10, -6, 6, 14);    // Sağ kol

    // Evrak çantası (sağ elde)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(14, 4, 10, 8);
    ctx.fillStyle = '#654321';
    ctx.fillRect(17, 2, 4, 3);

    // Kafa (ten rengi)
    ctx.fillStyle = '#f5c99b';
    ctx.beginPath();
    ctx.arc(1, -16, 10, 0, Math.PI * 2);
    ctx.fill();

    // Saç (siyah, kısa)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(1, -20, 10, Math.PI, 0);
    ctx.fill();

    // Gözlük (küçük yatırımcı gözlüğü)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-2, -16, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(5, -16, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1.5, -16);
    ctx.lineTo(1.5, -16);
    ctx.stroke();

    // Gözler
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-2, -16, 1.2, 0, Math.PI * 2);
    ctx.arc(5, -16, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Ağız (kararlı ifade)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-2, -11);
    ctx.lineTo(4, -11);
    ctx.stroke();

    ctx.restore();
}

// ============ ÇİZİM ============
function draw() {
    // Arka plan
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yıldızlar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 60; i++) {
        const x = (i * 71) % canvas.width;
        const y = (i * 43) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Engeller
    pipes.forEach(pipe => {
        const bottomY = pipe.gapY + pipe.gap;
        const bottomHeight = canvas.height - bottomY;
        if (pipe.character === 'krump') {
            drawKrumpBlock(pipe.x, 0, pipe.width, pipe.gapY, true);
            drawKrumpBlock(pipe.x, bottomY, pipe.width, bottomHeight, false);
        } else {
            drawZedBlock(pipe.x, 0, pipe.width, pipe.gapY, true);
            drawZedBlock(pipe.x, bottomY, pipe.width, bottomHeight, false);
        }
    });

    // Coin'ler
    coins.forEach(coin => {
        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.rotate(coin.rotation);
        ctx.fillStyle = COIN_COLOR;
        ctx.shadowBlur = 20;
        ctx.shadowColor = COIN_COLOR;
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Z', 0, 0);
        ctx.restore();
    });

    // Yatırımcı + Füze
    drawInvestor(
        bird.x + bird.width / 2,
        bird.y + bird.height / 2,
        bird.rotation
    );

    // Skor
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#000';
    ctx.fillText('Skor: ' + score, 20, 45);

    // Coin sayısı
    ctx.fillStyle = COIN_COLOR;
    ctx.font = 'bold 22px Arial';
    ctx.fillText('ZKD: ' + coinCount, 20, 75);

    // Hız seviyesi
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Hız: ' + speedLevel + '/' + MAX_SPEED_LEVEL, canvas.width - 20, 45);
    ctx.shadowBlur = 0;
}

// ============ BORU OLUŞTUR ============
function spawnPipe() {
    const minGapY = 80;
    const maxGapY = canvas.height - PIPE_GAP - 80;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    const character = Math.random() > 0.5 ? 'krump' : 'zed';

    pipes.push({
        x: canvas.width,
        width: PIPE_WIDTH,
        gapY: gapY,
        gap: PIPE_GAP,
        passed: false,
        character: character
    });

    if (Math.random() > 0.4) {
        coins.push({
            x: canvas.width + PIPE_WIDTH / 2,
            y: gapY + PIPE_GAP / 2,
            radius: 12,
            rotation: 0
        });
    }
}

// ============ OYUN BİTTİ ============
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coinCount;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// ============ KONTROLLER ============
function zipla() {
    if (gameRunning) {
        bird.velocity = JUMP_FORCE;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        zipla();
    }
});

canvas.addEventListener('click', zipla);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    zipla();
}, { passive: false });

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// ============ BAŞLAT ============
init();
