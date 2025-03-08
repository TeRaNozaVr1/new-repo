import { Connection, PublicKey } from "@solana/web3.js";

// Підключення до Solana мережі
const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=85a0c15f-2d67-4170-b9e1-64e56f59c1f7", "confirmed");

// Функція для підключення гаманця Phantom
export async function connectWallet() {
    try {
        if (!window.solana) {
            throw new Error("Phantom гаманець не знайдено.");
        }

        const wallet = window.solana;

        if (!wallet.isConnected) {
            await wallet.connect();  // Підключення до Phantom
        }

        console.log("Гаманець підключено:", wallet.publicKey.toString());
        return wallet.publicKey;
    } catch (error) {
        console.error("Помилка при підключенні гаманця:", error.message);
        throw new Error("Помилка при підключенні гаманця: " + error.message);
    }
}

// Функція для отримання балансу
export async function getBalance(walletPublicKey) {
    try {
        const publicKey = new PublicKey(walletPublicKey);
        const balance = await connection.getBalance(publicKey);
        console.log("Баланс гаманця:", balance / 1e9);  // Баланс в SOL
        return balance / 1e9;  // Перетворюємо на SOL
    } catch (error) {
        console.error("Помилка при отриманні балансу:", error.message);
        throw new Error("Помилка при отриманні балансу: " + error.message);
    }
}

// Функція для отримання історії транзакцій
export async function getTransactionHistory(walletPublicKey) {
    try {
        const publicKey = new PublicKey(walletPublicKey);

        // Отримання історії транзакцій для гаманця (можна обмежити кількість транзакцій)
        const confirmedSignatures = await connection.getConfirmedSignaturesForAddress2(publicKey, { limit: 5 });

        if (confirmedSignatures.length === 0) {
            console.log("Немає історії транзакцій.");
            return [];
        }

        // Отримання деталей кожної транзакції
        const transactions = [];
        for (let i = 0; i < confirmedSignatures.length; i++) {
            const signature = confirmedSignatures[i].signature;
            const txDetails = await connection.getTransaction(signature);
            transactions.push(txDetails);
        }

        console.log("Історія транзакцій:", transactions);
        return transactions;
    } catch (error) {
        console.error("Помилка при отриманні історії транзакцій:", error.message);
        throw new Error("Помилка при отриманні історії транзакцій: " + error.message);
    }
}

