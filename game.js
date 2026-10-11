const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Oyun değişkenleri
let bird, pipes, coins, score, coinCount, gameRunning, gravity, jumpForce, frameCount;

// Renkler
const BIRD_COLOR = '#ffcc00';
const PIPE_COLOR = '#ff00ff';
const COIN_COLOR = '#00ffff';

function init() {
    bird = {
        x: 80,
        y: 300,
        width: 30,
        height: 30,
        velocity: 0,
        rotation: 0
    };
    pipes = [];
    coins = [];
    score = 0;
    coinCount = 0;
    gravity = 0.5;
    jumpForce = -8;
    gameRunning = false;
    frameCount = 0;
}

function startGame() {
    init();
    gameRunning = true;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    gameLoop();
    spawnPipes();
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    frameCount++;
    
    // Kuş fiziği
    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);

    // Boruları güncelle
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 3;
        
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
        coins[i].x -= 3;
        coins[i].rotation += 0.1;
        
        if (checkCollision(bird, coins[i])) {
            coinCount++;
            coins.splice(i, 1);
            continue;
        }
        
        if (coins[i].x + coins[i].radius < 0) {
            coins.splice(i, 1);
        }
    }

    // Zemin ve tavan kontrolü
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver();
    }
}

function checkCollision(bird, pipe) {
    const birdLeft = bird.x;
    const birdRight = bird.x + bird.width;
    const birdTop = bird.y;
    const birdBottom = bird.y + bird.height;
    
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;
    const pipeTop = pipe.y;
    const pipeBottom = pipe.y + pipe.height;
    
    if (birdRight > pipeLeft && birdLeft < pipeRight && 
        birdBottom > pipeTop && birdTop < pipeBottom) {
        return true;
    }
    
    if (pipe.radius) {
        const dx = bird.x + bird.width/2 - pipe.x;
        const dy = bird.y + bird.height/2 - pipe.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        return distance < bird.width/2 + pipe.radius;
    }
    
    return false;
}

function draw() {
    // Arka plan
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Yıldızlar
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 53) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Boruları çiz
    pipes.forEach(pipe => {
        ctx.fillStyle = PIPE_COLOR;
        ctx.shadowBlur = 15;
        ctx.shadowColor = PIPE_COLOR;
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY);
        ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, pipe.width, canvas.height - pipe.gapY - pipe.gap);
        ctx.shadowBlur = 0;
    });

    // Coin'leri çiz
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
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Z', 0, 0);
        ctx.restore();
    });

    // Kuşu çiz
    ctx.save();
    ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    ctx.rotate(bird.rotation);
    ctx.fillStyle = BIRD_COLOR;
    ctx.shadowBlur = 15;
    ctx.shadowColor = BIRD_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, bird.width/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, -5);
    ctx.lineTo(25, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Skor
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Skor: ' + score, 20, 40);
    ctx.fillStyle = COIN_COLOR;
    ctx.fillText('ZKD: ' + coinCount, 20, 70);
}

function spawnPipes() {
    if (!gameRunning) return;
    
    const gap = 150;
    const gapY = Math.random() * (canvas.height - gap - 100) + 50;
    
    pipes.push({
        x: canvas.width,
        width: 60,
        gapY: gapY,
        gap: gap,
        passed: false
    });
    
    if (Math.random() > 0.3) {
        coins.push({
            x: canvas.width + 100,
            y: gapY + gap / 2,
            radius: 12,
            rotation: 0
        });
    }
    
    setTimeout(spawnPipes, 1800);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coinCount;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Kontroller
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameRunning) {
            bird.velocity = jumpForce;
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) {
        bird.velocity = jumpForce;
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        bird.velocity = jumpForce;
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Başlat
init();
