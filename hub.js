const GAMES = [
    { id: 1, name: "Escape from Depth 7", icon: "🚀", url: "game1.html" },
    { id: 2, name: "Tank Breakout", icon: "🪖", url: "chapter2.html" },
    { id: 3, name: "Boss: Krump", icon: "👑", url: "#" },
    { id: 4, name: "Tower of Zorak Creed", icon: "🏢", url: "#" },
    { id: 5, name: "Liquidity Escape", icon: "🌊", url: "#" },
    { id: 6, name: "Coin Miner", icon: "⛏️", url: "#" },
    { id: 7, name: "Whale Hunt", icon: "🐋", url: "#" },
    { id: 8, name: "Zakardia Exchange", icon: "📈", url: "#" },
    { id: 9, name: "Last Stand", icon: "⚔️", url: "#" },
    { id: 10, name: "Final: Freedom", icon: "🕊️", url: "#" }
];

function getProgress() {
    const kayit = localStorage.getItem('zakardiya_progress');
    return kayit ? parseInt(kayit) : 1;
}

function getCompleted() {
    const kayit = localStorage.getItem('zakardiya_completed');
    return kayit ? JSON.parse(kayit) : [];
}

function renderHub() {
    const grid = document.getElementById('gamesGrid');
    const progress = getProgress();
    const completed = getCompleted();
    grid.innerHTML = '';

    GAMES.forEach(game => {
        const slot = document.createElement('div');
        slot.className = 'game-slot';
        const isUnlocked = game.id <= progress;
        const isCompleted = completed.includes(game.id);
        if (isCompleted) slot.classList.add('completed');
        else if (isUnlocked) slot.classList.add('unlocked');
        else slot.classList.add('locked');

        slot.innerHTML = `
            <div class="slot-number">CHAPTER ${game.id}</div>
            <div class="slot-icon">${game.icon}</div>
            <div class="slot-name">${game.name}</div>
        `;

        if (isUnlocked && game.url !== '#') {
            slot.addEventListener('click', () => window.location.href = game.url);
        } else if (isUnlocked) {
            slot.addEventListener('click', () => alert('This chapter is still in development! 🚧'));
        }
        grid.appendChild(slot);
    });

    document.getElementById('progress-text').textContent = `Progress: ${completed.length} / 10`;
}

document.getElementById('storyBtn').addEventListener('click', () => {
    window.location.href = 'story.html';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('All progress will be deleted. Are you sure?')) {
        localStorage.removeItem('zakardiya_progress');
        localStorage.removeItem('zakardiya_completed');
        localStorage.removeItem('zed_story_seen');
        localStorage.removeItem('zed_manga_v2_seen');
        renderHub();
    }
});

// Play the new manga prologue once even for players who saw the old story.
if (!localStorage.getItem('zed_manga_v2_seen')) {
    localStorage.setItem('zed_manga_v2_seen', 'true');
    window.location.replace('story.html');
} else {
    renderHub();
}
