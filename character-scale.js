// Scale the full-body manga sprite to fit the original Flappy Zed play area.
const fullSizeDrawZed = window.drawZed;
window.drawZed = function (cx, cy, rotation, fuelRatio, t) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(0.74, 0.74);
    fullSizeDrawZed(0, 0, rotation, fuelRatio, t);
    ctx.restore();
};
