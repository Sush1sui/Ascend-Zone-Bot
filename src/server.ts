import express from "express";
import "dotenv/config";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 6969;

const BOT = process.env.BOT;
let timeoutId: NodeJS.Timeout;

function pingBot() {
    if (!BOT) return; // Prevent overlap if already pinging

    const attemptPing = () => {
        fetch(BOT)
            .then((res) => res.text())
            .then((text) => {
                console.log("Ping successful:", text);
            })
            .catch((err) => {
                clearTimeout(timeoutId);
                console.error("Ping failed, retrying:", err);
                timeoutId = setTimeout(attemptPing, 5000); // Retry after 5 seconds
            });
    };

    attemptPing(); // Start the initial ping
}

export function startServer() {
    app.get("/", (_req, res) => res.send("Bot is running"));

    setInterval(pingBot, 600000); // Ping every 10 minutes

    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

    // Graceful shutdown
    process.on("SIGINT", () => {
        console.log("Server shutting down gracefully");
        process.exit(0);
    });
}
