import { getBalance } from "./solana.js";
import { sendTransaction } from "./transaction.js";

const OWNER_WALLET = "4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"; // Гаманець для отримання USDT/USDC
const TOKEN_PRICE = 0.00048; // Ціна 1 токена у USD (1 SPL = 0.00048 USD)

const calculateUsdtAmount = (amount) => amount * 1e6; // Функція для перерахунку суми в USDT/USDC
const calculateSplAmount = (amount) => Math.floor(amount / (TOKEN_PRICE * 1e6)); // Функція для розрахунку SPL токенів

document.addEventListener("DOMContentLoaded", () => {
    const exchangeBtn = document.getElementById("exchangeBtn");

    // Перевірка наявності підключення через Phantom
    const checkPhantomConnection = async () => {
        if (!window.solana) {
            alert("Phantom гаманець не підключено. Будь ласка, встановіть Phantom або підключіться до нього.");
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

    // Перевірка доступності Phantom через глибокий лінк
    const checkDeepLinkConnection = async () => {
        // Створення URL для глибокого лінка
        const deepLink = "solana://";
        let deepLinkOpened = false;

        // Спроба відкрити deep link
        const timeout = setTimeout(() => {
            if (!deepLinkOpened) {
                alert("Phantom гаманець не знайдено. Спробуйте встановити Phantom.");
            }
        }, 2000); // Якщо не вдається відкрити за 2 секунди, показуємо повідомлення

        try {
            // Використовуємо window.location для спроби відкриття deep link
            window.location = deepLink;
            
            // Якщо користувач буде перенаправлений в App Store або Google Play, можемо це відстежити
            deepLinkOpened = true;
            clearTimeout(timeout);

            const wallet = window.solana;
            if (!wallet.isConnected) {
                await wallet.connect();
            }
            console.log("Phantom підключено через глибокий лінк.");
            return true;
        } catch (error) {
            clearTimeout(timeout);
            console.error("Помилка при підключенні через діплінк:", error);
            alert("Не вдалося підключити Phantom через діплінк.");
            return false;
        }
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

            // Перевірка на USDT чи USDC
            if (token !== 'USDT' && token !== 'USDC') {
                alert("Невірний токен!");
                return;
            }

            // Перевірка підключення через Phantom або через діплінк
            const isConnected = await checkPhantomConnection() || await checkDeepLinkConnection();
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
