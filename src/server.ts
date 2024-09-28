import express from "express";
import "dotenv/config";
// import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

export function startServer() {
    app.get("/", (_req, res) => res.send("Bot is running"));

    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

    process.on("SIGINT", () => {
        console.log("Server shutting down gracefully");
        process.exit(0);
    });
}
