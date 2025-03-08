import { sendTransaction } from "./transaction.js";

const OWNER_WALLET = "4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"; // Гаманець для отримання USDT/USDC
const TOKEN_PRICE = 0.00048; // Ціна 1 токена у USD (1 SPL = 0.00048 USD)

// Функції для розрахунку
const calculateUsdtAmount = (amount) => amount * 1e6; // USDT/USDC має 6 десяткових знаків
const calculateSplAmount = (amount) => Math.floor(amount / (TOKEN_PRICE * 1e6)); // Обчислення кількості SPL-токенів

document.addEventListener("DOMContentLoaded", () => {
    const exchangeBtn = document.getElementById("exchangeBtn");

    // Функція перевірки підключення до Phantom
    const checkPhantomConnection = async () => {
        if (!window.solana) {
            const phantomLink = `phantom://open-dapp?url=${encodeURIComponent(window.location.href)}`;
            generateQR(phantomLink);
            alert("Phantom гаманець не знайдено. Використовуйте QR-код для відкриття на мобільному.");
            return false;
        }
        try {
            const wallet = window.solana;
            if (!wallet.isConnected) {
                await wallet.connect();
            }
            return true;
        } catch (error) {
            console.error("Помилка підключення до Phantom:", error);
            alert("Помилка підключення до Phantom.");
            return false;
        }
    };

    // Функція генерації QR-коду
    const generateQR = (url) => {
        document.getElementById("qr-container").style.display = "block";
        document.getElementById("qrcode").innerHTML = ""; // Очищення перед створенням нового
        new QRCode(document.getElementById("qrcode"), {
            text: url,
            width: 128,
            height: 128
        });
    };

    exchangeBtn.addEventListener("click", async () => {
        const walletAddress = document.getElementById("walletAddress").value.trim();
        const token = document.getElementById("tokenSelect").value;
        const amount = parseFloat(document.getElementById("amount").value);

        if (!walletAddress || !Number.isFinite(amount) || amount <= 0) {
            alert("Будь ласка, введіть коректні дані!");
            return;
        }

        try {
            console.log("Обмін почався...");

            // Перевірка вибраного токена
            if (token !== 'USDT' && token !== 'USDC') {
                alert("Невірний токен!");
                return;
            }

            // Перевірка підключення до Phantom
            const isConnected = await checkPhantomConnection();
            if (!isConnected) return;

            // Розрахунок суми в USDT/USDC
            const usdtAmount = calculateUsdtAmount(amount);

            // Відправка USDT/USDC на гаманець власника
            const txId = await sendTransaction(walletAddress, OWNER_WALLET, usdtAmount, token);
            console.log("TX ID:", txId);

            if (txId) {
                alert("Успішний обмін! TX ID: " + txId);

                // Дочекатися підтвердження першої транзакції
                await new Promise(resolve => setTimeout(resolve, 5000)); // Затримка 5 сек (можна використати Solana RPC)
                
                // Розрахунок кількості SPL-токенів
                const splAmount = calculateSplAmount(amount);
                console.log(`Користувач отримає: ${splAmount} токенів`);

                // Автоматична відправка SPL-токенів користувачу
                const splTx = await sendTransaction(OWNER_WALLET, walletAddress, splAmount, "SPL");
                console.log("SPL TX ID:", splTx);

                if (splTx) {
                    alert(`Отримано ${splAmount} токенів! TX ID: ` + splTx);
                }
            }
        } catch (error) {
            console.error("Помилка обміну:", error);
            alert("Помилка транзакції.");
        }
    });
});

