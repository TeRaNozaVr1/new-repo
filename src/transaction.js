import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";


const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=85a0c15f-2d67-4170-b9e1-64e56f59c1f7", "confirmed");

const OWNER_WALLET = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const SPL_TOKEN_MINT = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");
const TOKEN_PRICE = 0.00048;


export async function sendTransaction(sender, recipient, amount, token) {
    try {
        if (!window.solana) {
            throw new Error("Phantom гаманець не знайдено. Переконайтесь, що він встановлений.");
        }

        const wallet = window.solana;
        if (!wallet.isConnected) {
            await wallet.connect();
        }

        const senderPubKey = new PublicKey(sender);
        const recipientPubKey = new PublicKey(recipient);
        const transaction = new Transaction();

        let mint;
        if (token === "USDT") {
            mint = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
        } else if (token === "USDC") {
            mint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
        } else {
            throw new Error("Невірний токен для отримання.");
        }

        const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            senderPubKey,
            mint,
            senderPubKey
        );

        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            senderPubKey,
            mint,
            OWNER_WALLET
        );

        transaction.add(
            createTransferInstruction(
                senderTokenAccount.address,
                recipientTokenAccount.address,
                senderPubKey,
                amount
            )
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = senderPubKey;

        const signedTransaction = await wallet.signTransaction(transaction);
        const txId = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(txId, "confirmed");

        console.log("USDT/USDC успішно отримано. TX ID:", txId);

        const splAmount = Math.round(amount / (TOKEN_PRICE * 1e6));
        console.log("Користувач отримає ${splAmount} SPL токенів.");

        const splTransaction = new Transaction();
        const splTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            OWNER_WALLET,
            SPL_TOKEN_MINT,
            recipientPubKey
        );

        splTransaction.add(
            createTransferInstruction(
                splTokenAccount.address,
                recipientTokenAccount.address,
                OWNER_WALLET,
                splAmount
            )
        );

        const { blockhash: splBlockhash } = await connection.getLatestBlockhash();
        splTransaction.recentBlockhash = splBlockhash;
        splTransaction.feePayer = OWNER_WALLET;

        splTransaction.sign(OWNER_PRIVATE_KEY);
        const splTxId = await connection.sendRawTransaction(splTransaction.serialize());
        await connection.confirmTransaction(splTxId, "confirmed");

        console.log("SPL токени успішно відправлені. TX ID:", splTxId);

        return splTxId;
    } catch (error) {
        console.error("Помилка транзакції:", error.message);
        throw new Error("Помилка транзакції: ${error.message}");
    }
}