const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SERVER = "http://92.5.228.134:8000";
const OUTPUT_DIR = path.join(__dirname, "banners");

const devices = process.argv.slice(2);

if (devices.length === 0) {
    console.log("Usage: node fetch-banner.js DEVICE1 DEVICE2 ...");
    console.log("Example: node fetch-banner.js DUCHAMP INGRES MONDRIAN");
    process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fetch(device) {
    return new Promise((resolve, reject) => {
        const url = `${SERVER}/banner?device=${encodeURIComponent(device)}`;
        const filePath = path.join(OUTPUT_DIR, `${device}.png`);

        http.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`${device}: HTTP ${res.statusCode}`));
                return;
            }

            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                fs.writeFileSync(filePath, Buffer.concat(chunks));
                console.log(`Saved: ${filePath}`);
                resolve(filePath);
            });
        }).on("error", reject);
    });
}

async function main() {
    for (const device of devices) {
        try {
            await fetch(device.toUpperCase());
        } catch (err) {
            console.error(`Failed: ${err.message}`);
        }
    }

    try {
        execSync("git add banners/", { cwd: __dirname });
        execSync(`git commit -m "Add banners: ${devices.join(", ")}"`, { cwd: __dirname });
        console.log("Committed to git");
    } catch (err) {
        console.log("Nothing to commit or git error");
    }
}

main();
