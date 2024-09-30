import "dotenv/config";
import mongoose from "mongoose";
import { startBot } from "./app";
import { initializeVerification } from "./modules/Verification";
import { startServer } from "./server";
import { initializeStickyMessages } from "./modules/StickyMessage";

const uri = process.env.DB_CONNECTION_STRING;
if (!uri) throw new Error("No connection string");
mongoose
    .connect(uri)
    .then(() => {
        initializeVerification();
        initializeStickyMessages();
        console.log("Connected to DB");
    })
    .catch((e) => console.log(e));

startServer();
startBot();
