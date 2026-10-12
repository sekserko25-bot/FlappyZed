// Manga-inspired Zed renderer: a young survivor with messy black/cyan hair and his worn jacket.
window.drawZed = function (cx, cy, rotation, fuelRatio, t) {
    const pulse = 0.5 + Math.sin(t / 135) * 0.5;
    ctx.save();
    ctx.translate(cx, cy + Math.sin(t / 170) * 2);
    ctx.rotate(rotation * 0.38);

    // The handmade thruster sits behind Zed; his face and clothes stay visible.
    const flameLength = 8 + Math.random() * 8 + fuelRatio * 15;
    const flame = ctx.createLinearGradient(-18, 0, -18 - flameLength, 0);
    flame.addColorStop(0, '#fff4b0');
    flame.addColorStop(0.35, '#ffb12e');
    flame.addColorStop(0.72, '#ff522e');
    flame.addColorStop(1, 'rgba(255,55,30,0)');
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff663a';
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.quadraticCurveTo(-23 - flameLength, -2, -18 - flameLength, 0);
    ctx.quadraticCurveTo(-23 - flameLength, 3, -15, 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // A compact, improvised rocket nozzle rather than a full space suit.
    ctx.fillStyle = '#28333b';
    ctx.strokeStyle = '#75818a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-17, -7);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-17, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffb33c';
    ctx.fillRect(-15, -2, 5, 4);

    // Red scarf whipping behind him, matching the manga's dramatic palette.
    ctx.fillStyle = '#a72536';
    ctx.beginPath();
    ctx.moveTo(-12, -7);
    ctx.quadraticCurveTo(-23, -14 - pulse * 3, -34, -10 - pulse * 5);
    ctx.lineTo(-29, -2);
    ctx.quadraticCurveTo(-21, -5, -12, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ef5864';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.quadraticCurveTo(-23, -9 - pulse * 2, -29, -8 - pulse * 3);
    ctx.stroke();

    // Dark worn jacket and shoulder, with teal edge light.
    const jacket = ctx.createLinearGradient(-8, -10, 15, 14);
    jacket.addColorStop(0, '#435463');
    jacket.addColorStop(0.5, '#202a35');
    jacket.addColorStop(1, '#101820');
    ctx.fillStyle = jacket;
    ctx.strokeStyle = '#0a1119';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.quadraticCurveTo(-5, -14, 5, -11);
    ctx.lineTo(13, -5);
    ctx.lineTo(12, 7);
    ctx.quadraticCurveTo(1, 15, -11, 9);
    ctx.lineTo(-16, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#39c8c8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, 7);
    ctx.quadraticCurveTo(1, 12, 10, 5);
    ctx.stroke();

    // One arm reaches forward as he fights his way upward.
    ctx.strokeStyle = '#26333d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.quadraticCurveTo(14, 10, 21, 8);
    ctx.stroke();
    ctx.fillStyle = '#d8ad91';
    ctx.beginPath();
    ctx.ellipse(21, 8, 4, 3, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Neck and determined face, turned toward the way ahead.
    ctx.fillStyle = '#c9967c';
    ctx.fillRect(3, -10, 7, 7);
    ctx.fillStyle = '#e0b59a';
    ctx.strokeStyle = '#241d20';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(1, -12);
    ctx.quadraticCurveTo(2, -23, 14, -21);
    ctx.quadraticCurveTo(22, -18, 21, -10);
    ctx.lineTo(17, -5);
    ctx.quadraticCurveTo(8, -3, 3, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark, messy hair with the unmistakable cyan streak from the story art.
    ctx.fillStyle = '#11171e';
    ctx.beginPath();
    ctx.moveTo(1, -12);
    ctx.lineTo(-2, -20);
    ctx.lineTo(5, -18);
    ctx.lineTo(4, -26);
    ctx.lineTo(11, -21);
    ctx.lineTo(15, -27);
    ctx.lineTo(17, -20);
    ctx.quadraticCurveTo(24, -18, 22, -11);
    ctx.lineTo(17, -13);
    ctx.lineTo(13, -10);
    ctx.lineTo(8, -14);
    ctx.lineTo(4, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#25c8ce';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, -21);
    ctx.lineTo(10, -17);
    ctx.lineTo(8, -13);
    ctx.moveTo(15, -22);
    ctx.lineTo(17, -17);
    ctx.stroke();

    // One visible, sharp eye and a small cheek mark give him a focused expression.
    ctx.fillStyle = '#ecf7f5';
    ctx.beginPath();
    ctx.moveTo(13, -13);
    ctx.quadraticCurveTo(17, -15, 19, -12);
    ctx.quadraticCurveTo(16, -9, 13, -11);
    ctx.fill();
    ctx.fillStyle = '#2ccbd3';
    ctx.beginPath();
    ctx.arc(16, -12, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#793e43';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(17, -7);
    ctx.lineTo(20, -8);
    ctx.stroke();

    // Jacket collar and a small turquoise keepsake on his chest.
    ctx.fillStyle = '#81919a';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(7, -5);
    ctx.lineTo(2, 1);
    ctx.lineTo(-4, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#36d5d8';
    ctx.shadowBlur = 7;
    ctx.shadowColor = '#31dbe0';
    ctx.beginPath();
    ctx.arc(1, 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (shieldActive) {
        ctx.strokeStyle = 'rgba(78, 241, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00eaff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 35, 28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
};
