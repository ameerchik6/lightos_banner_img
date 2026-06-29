const express = require("express");
const path = require("path");

const {
    createCanvas,
    loadImage,
    GlobalFonts,
} = require("@napi-rs/canvas");

const app = express();
const PORT = 8000;

// --------------------
// Загружаем шрифт
// --------------------

GlobalFonts.registerFromPath(
    path.join(__dirname, "evolve_medium.ttf"),
    "evolve_bold"
);

// --------------------
// Загружаем фон один раз
// --------------------

let bannerImage = null;

(async () => {
    bannerImage = await loadImage(
        path.join(__dirname, "banner.png")
    );

    console.log(
        `Banner loaded: ${bannerImage.width}x${bannerImage.height}`
    );
})();

// --------------------
// RoundRect
// --------------------
function roundRect(ctx, x, y, w, h, r) {

    ctx.beginPath();

    // левый верх
    ctx.moveTo(x, y);

    // верх
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);

    // правая сторона
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    // низ
    ctx.lineTo(x, y + h);

    // левая сторона (без скругления)
    ctx.lineTo(x, y);

    ctx.closePath();
}
// --------------------
// Banner
// --------------------

app.get("/banner", async (req, res) => {

    if (!bannerImage) {
        return res.status(503).send("Banner not loaded");
    }

    const device =
        (req.query.device || "INGRES")
            .toString()
            .toUpperCase();

    const canvas = createCanvas(
        bannerImage.width,
        bannerImage.height
    );

    const ctx = canvas.getContext("2d");

    // фон

    ctx.drawImage(
        bannerImage,
        0,
        0
    );

    // --------------------
    // НАСТРОЙКИ
    // --------------------

    const x = -1;
    const y = 12;

    const height = 83;
    const minWidth = 285;

    const leftPadding = 44;
    const rightPadding = 32;

    const radius = 43;

    const fontSize = 51;

    ctx.font = `${fontSize}px evolve_bold`;

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    const textWidth =
        ctx.measureText(device).width;

    const width = Math.max(
        minWidth,
        textWidth + leftPadding + rightPadding
    );
        // --------------------
    // ФОН
    // --------------------

    roundRect(
        ctx,
        x,
        y,
        width,
        height,
        radius
    );

    ctx.fillStyle = "#050505";
    ctx.fill();

    // --------------------
    // РАМКА
    // --------------------

    ctx.strokeStyle = "#b8892e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // --------------------
    // ТЕКСТ
    // --------------------

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        device,
        x + leftPadding,
        y + height / 2 + 1
    );

    // --------------------
    // PNG
    // --------------------

    const png = await canvas.encode("png");

    res.setHeader(
        "Content-Type",
        "image/png"
    );

    res.setHeader(
        "Cache-Control",
        "public, max-age=3600"
    );

    res.end(png);

});

// --------------------
// Главная
// --------------------

app.get("/", (req, res) => {

    res.send(`
<h2>LightOS Banner API</h2>

<p>
<a href="/banner?device=DUCHAMP">
/banner?device=DUCHAMP
</a>
</p>
`);

});

// --------------------
// Запуск
// --------------------

app.listen(PORT, () => {

    console.log(
        `Server started: http://localhost:${PORT}`
    );

});
