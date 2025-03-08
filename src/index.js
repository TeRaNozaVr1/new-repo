import { getBalance } from "./solana.js";
import { sendTransaction } from "./transaction.js";

const OWNER_WALLET = "4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"; // Гаманець для отримання USDT/USDC
const TOKEN_PRICE = 0.00048; // Ціна 1 токена у USD (1 SPL = 0.00048 USD)

const calculateUsdtAmount = (amount) => amount * 1e6; // Функція для перерахунку суми в USDT/USDC
const calculateSplAmount = (amount) => Math.floor(amount / (TOKEN_PRICE * 1e6)); // Функція для розрахунку SPL токенів

document.addEventListener("DOMContentLoaded", () => {
    const exchangeBtn = document.getElementById("exchangeBtn");
    const openInPhantomBtn = document.getElementById("openInPhantomBtn"); // Нова кнопка

    // Функція відкриття віджета через Phantom
    const openInPhantom = () => {
        const dappUrl = encodeURIComponent("https://new-repo-rho-ruddy.vercel.app/"); // Замініть на свій URL
        window.location.href = `phantom://open-dapp?url=${dappUrl}`;
    };

    // Додаємо обробник кліку для відкриття через Phantom
    openInPhantomBtn.addEventListener("click", openInPhantom);

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

            if (token !== 'USDT' && token !== 'USDC') {
                alert("Невірний токен!");
                return;
            }

            // Перевірка підключення до Phantom
            const isConnected = await checkPhantomConnection();
            if (!isConnected) return;

            const usdtAmount = calculateUsdtAmount(amount);
            const txId = await sendTransaction(walletAddress, OWNER_WALLET, usdtAmount, token);
            console.log("TX ID:", txId);

            if (txId) {
                alert("Успішний обмін! TX ID: " + txId);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Затримка 5 сек

                const splAmount = calculateSplAmount(amount);
                console.log(`Користувач отримає: ${splAmount} токенів`);

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

