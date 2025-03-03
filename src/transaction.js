import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { Buffer } from "buffer";

const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f", "confirmed");

export async function sendTransaction(sender, recipient, amount, token) {
    const senderPubKey = new PublicKey(sender);
    const recipientPubKey = new PublicKey(recipient);
    const transaction = new Transaction();

    if (token === "SPL") {
        const senderTokenAccount = await getAssociatedTokenAddress(new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"), senderPubKey);
        const recipientTokenAccount = await getAssociatedTokenAddress(new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"), recipientPubKey);

        transaction.add(createTransferInstruction(senderTokenAccount, recipientTokenAccount, senderPubKey, amount));
    } else {
        transaction.add(SystemProgram.transfer({ fromPubkey: senderPubKey, toPubkey: recipientPubKey, lamports: amount * 1e9 }));
    }

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPubKey;

    const signedTransaction = await window.solana.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(txId, "confirmed");

    return txId;
}
