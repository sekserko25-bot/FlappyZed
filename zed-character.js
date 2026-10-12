// Zed's upgraded hero renderer. Loaded after game1.js to replace its placeholder sprite.
window.drawZed = function (cx, cy, rotation, fuelRatio, t) {
    const pulse = 0.5 + Math.sin(t / 140) * 0.5;
    ctx.save();
    ctx.translate(cx, cy + Math.sin(t / 180) * 2);
    ctx.rotate(rotation * 0.45);

    // Cyan exhaust trail and hot orange core.
    const flameLength = 12 + Math.random() * 9 + fuelRatio * 16;
    const flame = ctx.createLinearGradient(-18, 0, -18 - flameLength, 0);
    flame.addColorStop(0, '#fff7a8');
    flame.addColorStop(0.28, '#ffb52e');
    flame.addColorStop(0.7, '#ff4d22');
    flame.addColorStop(1, 'rgba(255,50,20,0)');
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#ff6b2d';
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-17, -7);
    ctx.quadraticCurveTo(-25 - flameLength, -4, -20 - flameLength, 0);
    ctx.quadraticCurveTo(-25 - flameLength, 5, -17, 7);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rocket pack.
    ctx.fillStyle = '#172b45';
    ctx.strokeStyle = '#58e8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-25, -13, 14, 26, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffb52e';
    ctx.fillRect(-23, -5, 10, 3);
    ctx.fillRect(-23, 3, 10, 3);

    // Scarf streaming behind the hero.
    ctx.fillStyle = '#f04455';
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.quadraticCurveTo(-25, -15 + pulse * 3, -35, -11 + pulse * 5);
    ctx.lineTo(-29, -3);
    ctx.quadraticCurveTo(-22, -6, -12, -3);
    ctx.closePath();
    ctx.fill();

    // Compact flight suit silhouette.
    const suit = ctx.createLinearGradient(-4, -19, 12, 18);
    suit.addColorStop(0, '#e8f7ff');
    suit.addColorStop(0.5, '#82b9d2');
    suit.addColorStop(1, '#426b89');
    ctx.fillStyle = suit;
    ctx.strokeStyle = '#13263c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-13, -9);
    ctx.quadraticCurveTo(-7, -19, 5, -16);
    ctx.lineTo(12, -8);
    ctx.lineTo(13, 9);
    ctx.quadraticCurveTo(2, 17, -11, 10);
    ctx.lineTo(-16, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shoulder armor and chest emblem.
    ctx.fillStyle = '#ffb52e';
    ctx.beginPath();
    ctx.ellipse(-5, -10, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09243b';
    ctx.beginPath();
    ctx.arc(2, 1, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#57f1ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffe071';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', 2, 1);

    // Helmet with a sharp glass visor.
    ctx.fillStyle = '#d9f5ff';
    ctx.strokeStyle = '#16334d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(8, -5, 15, 14, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#10283e';
    ctx.beginPath();
    ctx.ellipse(13, -6, 9, 8, 0.1, -1.2, 1.55);
    ctx.lineTo(7, 1);
    ctx.quadraticCurveTo(3, -4, 5, -9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#68edff';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(9, -11);
    ctx.lineTo(16, -10);
    ctx.lineTo(11, -4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Small top antenna and cyan running lights.
    ctx.strokeStyle = '#ffb52e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(7, -18);
    ctx.lineTo(10, -23);
    ctx.stroke();
    ctx.fillStyle = '#ffdf71';
    ctx.beginPath();
    ctx.arc(10, -23, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 9;
    ctx.shadowColor = '#55eeff';
    ctx.fillStyle = '#55eeff';
    ctx.beginPath();
    ctx.arc(-8, 5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (shieldActive) {
        ctx.strokeStyle = 'rgba(78, 241, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00eaff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 27, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
};
