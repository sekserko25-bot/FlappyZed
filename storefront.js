// Future store placeholders: gameplay drops stay disabled until the paid shop is implemented.
const originalSpawnPipe = window.spawnPipe;
window.spawnPipe = function () {
    originalSpawnPipe();
    powerUps.length = 0;
};
window.activatePowerUp = function () {
    // Extra life, shield and magnet are reserved for the future shop.
};
powerUps.length = 0;
