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
                // Запит на підключення
                await wallet.connect();
            }
            return true;
        } catch (error) {
            console.error("Помилка підключення до Phantom:", error);
            alert("Помилка підключення до Phantom.");
            return false;
        }
    };

    // Обробник події для кнопки обміну
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

