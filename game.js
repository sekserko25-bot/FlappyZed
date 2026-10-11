const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// ============ OYUN DEĞİŞKENLERİ ============
let bird, pipes, coins, score, coinCount, gameRunning;
let lastSpawnTime, lastTimestamp;

// Renkler
const BIRD_COLOR = '#ffcc00';
const PIPE_COLOR = '#ff00ff';
const COIN_COLOR = '#00ffff';

// ============ FİZİK AYARLARI (Orijinal Flappy Bird Değerleri) ============
const GRAVITY = 0.45;              // Yerçekimi
const JUMP_FORCE = -8.5;           // Zıplama gücü
const MAX_FALL_SPEED = 10;         // Maksimum düşüş hızı
const PIPE_SPEED = 3;              // Boru hızı
const PIPE_GAP = 150;              // Borular arası boşluk
const PIPE_WIDTH = 60;             // Boru genişliği
const PIPE_SPAWN_INTERVAL = 1800;  // Boru oluşturma aralığı (ms)
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 26;

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
}

// ============ OYUNU BAŞLAT ============
function startGame() {
    init();
    bird.y = canvas.height / 2 - BIRD_HEIGHT / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    gameRunning = true;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    lastSpawnTime = performance.now();
    lastTimestamp = 0;
    requestAnimationFrame(gameLoop);
}

// ============ OYUN DÖNGÜSÜ (Delta Time Destekli) ============
function gameLoop(timestamp) {
    if (!gameRunning) return;

    if (!lastTimestamp) lastTimestamp = timestamp;

    // Geçen süreyi hesapla (saniye cinsinden), maksimum 0.1 saniye ile sınırla
    let deltaTime = (timestamp - lastTimestamp) / 1000;
    if (deltaTime > 0.1) deltaTime = 0.1;
    lastTimestamp = timestamp;

    // 60 FPS'e göre normalize et
    const dt = deltaTime * 60;

    update(dt, timestamp);
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// ============ GÜNCELLEME ============
function update(dt, timestamp) {
    // Kuş fiziği
    bird.velocity += GRAVITY * dt;
    
    // Maksimum düşüş hızını sınırla
    if (bird.velocity > MAX_FALL_SPEED) {
        bird.velocity = MAX_FALL_SPEED;
    }
    
    bird.y += bird.velocity * dt;

    // Kuşun dönüş açısı (hıza göre)
    let targetRotation = Math.min(Math.max(bird.velocity * 0.08, -0.6), 1.2);
    bird.rotation += (targetRotation - bird.rotation) * 0.15 * dt;

    // Boruları güncelle
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED * dt;

        if (checkCollision(bird, pipes[i])) {
            gameOver();
            return;
        }

        if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].passed = true;
            score++;
        }

        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
        }
    }

    // Coin'leri güncelle
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= PIPE_SPEED * dt;
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

    // Zemin kontrolü
    if (bird.y + bird.height >= canvas.height) {
        bird.y = canvas.height - bird.height;
        gameOver();
        return;
    }

    // Tavan kontrolü
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Yeni boru oluştur
    if (timestamp - lastSpawnTime > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastSpawnTime = timestamp;
    }
}

// ============ BORU ÇARPIŞMA KONTROLÜ ============
function checkCollision(bird, pipe) {
    const birdLeft = bird.x + 4;
    const birdRight = bird.x + bird.width - 4;
    const birdTop = bird.y + 4;
    const birdBottom = bird.y + bird.height - 4;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;

    // ÜST BORU
    const topPipeTop = 0;
    const topPipeBottom = pipe.gapY;

    if (birdRight > pipeLeft && birdLeft < pipeRight &&
        birdBottom > topPipeTop && birdTop < topPipeBottom) {
        return true;
    }

    // ALT BORU
    const bottomPipeTop = pipe.gapY + pipe.gap;
    const bottomPipeBottom = canvas.height;

    if (birdRight > pipeLeft && birdLeft < pipeRight &&
        birdBottom > bottomPipeTop && birdTop < bottomPipeBottom) {
        return true;
    }

    return false;
}

// ============ COIN ÇARPIŞMA KONTROLÜ ============
function checkCoinCollision(bird, coin) {
    const birdCenterX = bird.x + bird.width / 2;
    const birdCenterY = bird.y + bird.height / 2;
    const dx = birdCenterX - coin.x;
    const dy = birdCenterY - coin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (bird.width / 2) + coin.radius;
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

    // Borular
    pipes.forEach(pipe => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = PIPE_COLOR;
        ctx.fillStyle = PIPE_COLOR;

        ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY);

        const bottomY = pipe.gapY + pipe.gap;
        const bottomHeight = canvas.height - bottomY;
        ctx.fillRect(pipe.x, bottomY, pipe.width, bottomHeight);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(pipe.x, 0, 4, pipe.gapY);
        ctx.fillRect(pipe.x, bottomY, 4, bottomHeight);

        ctx.restore();
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

    // Kuş
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);

    // Gövde
    ctx.fillStyle = BIRD_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = BIRD_COLOR;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Göz (beyaz)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Göz bebeği
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Gaga
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, -4);
    ctx.lineTo(24, 4);
    ctx.closePath();
    ctx.fill();

    // Kanat
    ctx.fillStyle = '#e6a800';
    ctx.beginPath();
    ctx.ellipse(-4, 2, 8, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

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
    ctx.shadowBlur = 0;
}

// ============ BORU OLUŞTUR ============
function spawnPipe() {
    const minGapY = 80;
    const maxGapY = canvas.height - PIPE_GAP - 80;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    pipes.push({
        x: canvas.width,
        width: PIPE_WIDTH,
        gapY: gapY,
        gap: PIPE_GAP,
        passed: false
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
