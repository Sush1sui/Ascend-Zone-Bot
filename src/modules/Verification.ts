import mongoose from "mongoose";
import "dotenv/config";
import Verification from "../Models/Verification.model";

const uri = process.env.DB_CONNECTION_STRING;
if (!uri) throw new Error("No connection string");

mongoose
    .connect(uri)
    .then(() => {
        initializeVerification();
        console.log("Connected to DB");
    })
    .catch((e) => console.log(e));

async function initializeVerification() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage === null) {
        const verificationMessage = new Verification({
            verificationMessagePresent: false,
            verificationChannelID: null,
            verificationMessageID: null,
        });
        await verificationMessage.save();
    }
}

export async function setVerificationStatus(value: boolean) {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage) {
        await existingVerificationMessage.updateOne({
            verificationMessagePresent: value,
            verificationChannelID:
                existingVerificationMessage.verificationChannelID,
            verificationMessageID:
                existingVerificationMessage.verificationMessageID,
        });
    }
}

export async function getVerificationChannelID() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage)
        return existingVerificationMessage.verificationChannelID;
    return null;
}

export async function getVerificationMessageID() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage)
        return existingVerificationMessage.verificationMessageID;
    return null;
}

export async function setVerificationChannelID(
    value: string | undefined | null
) {
    if (value === undefined) throw new Error("Value is undefined");
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage) {
        await existingVerificationMessage.updateOne({
            verificationChannelID: value,
            verificationMessageID:
                existingVerificationMessage.verificationMessageID,
            verificationMessagePresent:
                existingVerificationMessage.verificationMessagePresent,
        });
    }
}

export async function setVerificationMessageID(
    value: string | undefined | null
) {
    if (value === undefined) throw new Error("Value is undefined");
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage) {
        await existingVerificationMessage.updateOne({
            verificationMessageID: value,
            verificationChannelID:
                existingVerificationMessage.verificationChannelID,
            verificationMessagePresent:
                existingVerificationMessage.verificationMessagePresent,
        });
    }
}

export async function getVerificationMessageStatus() {
    const existingVerificationMessage = await Verification.findOne({});

    if (existingVerificationMessage)
        return existingVerificationMessage.verificationMessagePresent;
    return null;
}
