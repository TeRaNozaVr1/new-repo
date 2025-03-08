import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";

// Підключення до Solana мережі
const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=85a0c15f-2d67-4170-b9e1-64e56f59c1f7", "confirmed");

// Адреса отримувача та токена
const OWNER_WALLET = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const SPL_TOKEN_MINT = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");
const TOKEN_PRICE = 0.00048;

// Функція для підключення через глибокий лінк Phantom
// Функція для підключення через глибокий лінк Phantom
export async function connectToPhantom() {
    try {
        if (window.solana && window.solana.isPhantom) {
            // Перевірка на підключення
            if (!window.solana.isConnected) {
                // Якщо Phantom не підключено, пробуємо підключитися
                await window.solana.connect();
            }
            
            // Перевірка чи підключено
            const publicKey = window.solana.publicKey.toString();
            if (publicKey) {
                console.log("✅ Підключено до Phantom:", publicKey);
            }
        } else {
            console.log("⚠️ Phantom не знайдено на сторінці.");
            // Якщо гаманець Phantom не встановлений, направляємо користувача до установки
            alert("Будь ласка, встановіть Phantom гаманець.");
            window.open("https://phantom.app/", "_blank");
        }
    } catch (error) {
        console.error("Помилка підключення до Phantom:", error.message);
        throw new Error("Помилка підключення до Phantom.");
    }
}

// Функція для перевірки наявності гаманця і відправлення deeplink на мобільні пристрої
export function openPhantomAppForMobile() {
    try {
        if (/Android|iPhone/i.test(navigator.userAgent)) {
            const deepLink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://new-repo-rho-ruddy.vercel.app/")}&dapp_encryption_public_key=&cluster=mainnet-beta&redirect_link=${encodeURIComponent(window.location.href)}`;
            window.location.href = deepLink;
        } else {
            console.log("Не на мобільному пристрої. Перевірте наявність Phantom.");
        }
    } catch (error) {
        console.error("Помилка відкриття Phantom на мобільному пристрої:", error.message);
        throw new Error("Помилка відкриття Phantom на мобільному пристрої.");
    }
}

// Функція для автоматичного підключення до Phantom, якщо він вже встановлений
export async function connectWallet(autoConnect = false) {
    if (window.solana && window.solana.isPhantom) {
        try {
            const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

            // Зберігаємо адресу гаманця
            localStorage.setItem("phantomWallet", response.publicKey.toString());

            // Оновлюємо UI
            console.log("✅ Wallet connected:", response.publicKey.toString());
        } catch (err) {
            console.error("❌ Connection failed:", err);
            localStorage.removeItem("phantomWallet"); // Очищуємо дані у разі помилки
        }
    } else {
        console.log("⚠️ Phantom не знайдено. Відкриваємо додаток...");

        // Для мобільних пристроїв використовуємо deeplink
        if (/Android|iPhone/i.test(navigator.userAgent)) {
            const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://new-repo-rho-ruddy.vercel.app/")}&dapp_encryption_public_key=&cluster=mainnet-beta&redirect_link=${encodeURIComponent(window.location.href)}`;
            window.location.href = deeplink;
        } else {
            alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
            window.open("https://phantom.app/", "_blank");
        }
    }
}


export async function sendTransaction(sender, recipient, amount, token) {
    try {
        // Перевірка наявності Phantom гаманця на пристрої
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error("Phantom гаманець не знайдено. Переконайтесь, що він встановлений.");
        }

        const wallet = window.solana;

        // Якщо гаманець не підключено, підключаємо
        if (!wallet.isConnected) {
            await wallet.connect();
        }

        const senderPubKey = new PublicKey(sender);
        const recipientPubKey = new PublicKey(recipient);
        const transaction = new Transaction();

        // Вибір токену
        let mint;
        if (token === "USDT") {
            mint = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
        } else if (token === "USDC") {
            mint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
        } else {
            throw new Error("Невірний токен для отримання.");
        }

        // Отримання або створення токен-рахунку відправника
        const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            senderPubKey,
            mint,
            senderPubKey
        );

        // Отримання або створення токен-рахунку для отримувача
        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            senderPubKey,
            mint,
            OWNER_WALLET
        );

        // Додавання інструкції для передачі токенів
        transaction.add(
            createTransferInstruction(
                senderTokenAccount.address,
                recipientTokenAccount.address,
                senderPubKey,
                amount
            )
        );

        // Отримання blockhash та підтвердження транзакції
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = senderPubKey;

        // Підписання та відправка транзакції
        const signedTransaction = await wallet.signTransaction(transaction);
        const txId = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(txId, "confirmed");

        console.log("USDT/USDC успішно отримано. TX ID:", txId);

        // Обчислення кількості SPL токенів
        const splAmount = Math.round(amount / (TOKEN_PRICE * 1e6));
        console.log(`Користувач отримає ${splAmount} SPL токенів.`);

        // Створення транзакції для передачі SPL токенів
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

        // Підписання та відправка транзакції для SPL токенів
        const splTxId = await connection.sendRawTransaction(splTransaction.serialize());
        await connection.confirmTransaction(splTxId, "confirmed");

        console.log("SPL токени успішно відправлені. TX ID:", splTxId);

        return splTxId;
    } catch (error) {
        console.error("Помилка транзакції:", error.message);
        throw new Error(`Помилка транзакції: ${error.message}`);
    }
}

