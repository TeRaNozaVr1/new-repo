import { Connection, PublicKey } from "@solana/web3.js";

const SOLANA_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export async function getBalance(walletAddress) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        return balance / 10 ** 9; // Переводимо в SOL
    } catch (error) {
        console.error("Помилка отримання балансу:", error);
        return null;
    }
}
