import { getBalance } from "./solana.js";
import { sendTransaction } from "./transaction.js";

const OWNER_WALLET = "4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"; // Гаманець для отримання USDT/USDC
const SPL_TOKEN_MINT = "3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"; // Токен користувача
const TOKEN_PRICE = 0.00048; // Ціна 1 токена у USD

document.addEventListener("DOMContentLoaded", () => {
    const exchangeBtn = document.getElementById("exchangeBtn");

    exchangeBtn.addEventListener("click", async () => {
        const walletAddress = document.getElementById("walletAddress").value.trim();
        const token = document.getElementById("tokenSelect").value;
        const amount = parseFloat(document.getElementById("amount").value);

        if (!walletAddress || isNaN(amount) || amount <= 0) {
            alert("Будь ласка, введіть коректні дані!");
            return;
        }

        try {
            console.log("Обмін почався...");

            // Відправка USDT/USDC на гаманець власника
            const txId = await sendTransaction(walletAddress, OWNER_WALLET, amount, token);
            console.log("TX ID:", txId);

            if (txId) {
                alert("Успішний обмін! TX ID: " + txId);

                // Розрахунок кількості SPL-токенів для відправки користувачу
                const splAmount = amount / TOKEN_PRICE; // Наприклад, 10 USDT / 0.00048 = 20833.33 токенів
                console.log(`Користувач отримає: ${splAmount} наших токенів`);

                // Автоматична відправка SPL-токенів користувачеві
                const splTx = await sendTransaction(OWNER_WALLET, walletAddress, splAmount, "SPL");
                console.log("SPL TX ID:", splTx);

                if (splTx) {
                    alert(`Отримано ${splAmount.toFixed(2)} токенів! TX ID: ` + splTx);
                }
            }
        } catch (error) {
            console.error("Помилка обміну:", error);
            alert("Помилка транзакції.");
        }
    });
});


